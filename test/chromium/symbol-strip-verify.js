/* THE SYMBOL STRIP, THE GUIDE'S COMPACT FACE (owner, 15 Nov 2026: "Build the symbol nav panel per your
   recommendation"; f1055 is its node half). Driven with a real mouse, in the new look:
     1 · the strip's symbol is the first thing at the top left of the bar
     2 · resting the mouse on it opens the strip: down the LEFT edge, from under the bar to the foot, Board first,
         Settings last, one symbol per page; it presses nothing and moves no page
     3 · pointing at a symbol shows its NAME beside it, painted (elementFromPoint), right of the strip
     4 · moving the mouse away closes it
     5 · a press opens it, a second press closes it; a press on Obligations goes there and the strip lets go
     6 · the owner's three screens: every symbol in sight without scrolling, nothing sideways
   Every driven half is guarded, so a missing feature reports FAIL rather than timing out.
   Run: node test/chromium/symbol-strip-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const { seedHandbookWorld } = require('../handbook-world');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.SHOTS_OUT || path.join(__dirname, 'shots', 'symbol-strip');
fs.mkdirSync(OUT, { recursive: true });
let failures = 0, passes = 0;
const check = (ok, what, detail) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + what + (detail != null ? ' — ' + JSON.stringify(detail) : '')); if (ok) passes++; else failures++; };
const until = async (P, fn, arg, ms = 8000) => { try { await P.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const isOpen = () => { const s = document.getElementById('gd-strip'); return !!(s && !s.hidden && s.getBoundingClientRect().width > 0); };

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
    await P.evaluate(async () => { try { await stPrefSet('newLook', true); } catch (_){ } try { newLookApply(); } catch (_){ } });
    const has = await P.evaluate(() => !!document.getElementById('dk-nav') && typeof window.guideStripOpen === 'function');
    check(has, '0 the strip and its symbol exist');
    if (!has) throw new Error('no strip');

    /* 1 top left */
    const door = await P.evaluate(() => { const b = document.getElementById('dk-nav').getBoundingClientRect(), k = document.getElementById('dk-back').getBoundingClientRect();
      return { x: b.left, y: b.top, w: b.width, beforeBack: !document.getElementById('dk-back').getBoundingClientRect().width || b.right <= k.left + 1 }; });
    check(door.w > 0 && door.x < 40 && door.y < 30 && door.beforeBack, '1 the symbol is at the top left of the bar, before ‹', door);

    /* 2 rest the mouse on it */
    const view0 = await P.evaluate(() => state.view);
    const bb = await P.locator('#dk-nav').boundingBox();
    await P.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
    const opened = await until(P, isOpen, null, 3000);
    const geo = opened ? await P.evaluate(() => { const s = document.getElementById('gd-strip'), r = s.getBoundingClientRect(), hd = document.getElementById('top-header').getBoundingClientRect();
      const keys = [...s.querySelectorAll('[data-gds-go]')].map(b => b.getAttribute('data-gds-go'));
      const guide = [...new Set(GUIDE_NL.flatMap(st => st.rows.flat()))].filter(k => k !== 'import' || typeof caMayAdd !== 'function' || caMayAdd());
      return { left: Math.round(r.left), top: Math.round(r.top), hdr: Math.round(hd.bottom), bottom: Math.round(r.bottom), ih: innerHeight, keys, n: guide.length, dup: keys.length - new Set(keys).size }; }) : null;
    check(opened && geo.left === 0 && Math.abs(geo.top - geo.hdr) <= 1 && geo.bottom === geo.ih, '2a resting the mouse opens it, down the whole left edge under the bar', geo && { left: geo.left, top: geo.top, hdr: geo.hdr, bottom: geo.bottom, ih: geo.ih });
    check(!!geo && geo.keys[0] === 'board' && geo.keys[geo.keys.length - 1] === 'settings' && geo.dup === 0 && geo.keys.length === geo.n, '2b Board first, Settings last, one symbol per page', geo && { first: geo.keys[0], last: geo.keys[geo.keys.length - 1], n: geo.keys.length, guide: geo.n });
    check(await P.evaluate(v => state.view === v, view0), '2c opening it presses nothing and moves no page');

    /* 3 point at a symbol: its name, painted beside it */
    const ob = opened ? await P.locator('#gd-strip [data-gds-go="oblig"]').boundingBox() : null;
    if (ob){
      await P.mouse.move(bb.x + bb.width / 2, ob.y - 40, { steps: 4 });
      await P.mouse.move(ob.x + ob.width / 2, ob.y + ob.height / 2, { steps: 6 });
      await until(P, () => { const t = document.getElementById('gd-strip-tt'); return !!(t && !t.hidden && /Obligations|Åtaganden/.test(t.textContent)); }, null, 2000);
      const tip = await P.evaluate(() => { const t = document.getElementById('gd-strip-tt'); if (!t || t.hidden) return null; const r = t.getBoundingClientRect(), s = document.getElementById('gd-strip').getBoundingClientRect();
        t.style.pointerEvents = 'auto'; const hit = document.elementFromPoint(r.left + 8, r.top + r.height / 2); t.style.pointerEvents = '';
        return { text: t.textContent, painted: !!(hit && t.contains(hit)), right: r.left >= s.right - 1, inView: r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight, still: !!document.getElementById('gd-strip') && !document.getElementById('gd-strip').hidden }; });
      check(!!tip && /Obligations/.test(tip.text) && tip.painted && tip.right && tip.inView && tip.still, '3 pointing at a symbol shows its name beside it, painted, in sight', tip);
      await P.screenshot({ path: path.join(OUT, '1440x780-name.png') });
    } else check(false, '3 pointing at a symbol shows its name', 'no Obligations symbol');

    /* 4 move away */
    await P.mouse.move(700, 420, { steps: 6 });
    check(await until(P, () => { const s = document.getElementById('gd-strip'); return !s || s.hidden; }, null, 3000), '4 moving the mouse away closes it');

    /* 5 presses */
    await P.click('#dk-nav'); await P.mouse.move(700, 420);
    check(await until(P, isOpen, null, 2000), '5a a press opens it, and it stays when the mouse leaves');
    await P.waitForTimeout(500);
    check(await P.evaluate(isOpen), '5a′ still open after the mouse left');
    await P.click('#dk-nav');
    check(await until(P, () => { const s = document.getElementById('gd-strip'); return !s || s.hidden; }, null, 2000), '5b press it again and it closes');
    await P.click('#dk-nav'); await until(P, isOpen, null, 2000);
    const okSym = await P.locator('#gd-strip [data-gds-go="oblig"]').count();
    if (okSym){
      await P.click('#gd-strip [data-gds-go="oblig"]');
      const went = await until(P, () => typeof guideHereKey === 'function' && guideHereKey() === 'oblig', null, 8000);
      check(went && await P.evaluate(() => { const s = document.getElementById('gd-strip'); return !s || s.hidden; }), '5c a press on Obligations goes there and the strip lets go');
    } else check(false, '5c a press on Obligations goes there', 'no symbol');

    /* 6 three screens */
    for (const [ww, hh] of [[1440, 780], [1536, 730], [1366, 950]]){
      await P.setViewportSize({ width: ww, height: hh });
      await P.waitForTimeout(150);
      await P.click('#dk-nav'); await until(P, isOpen, null, 2000);
      const fit = await P.evaluate(() => { const s = document.getElementById('gd-strip'); if (!s || s.hidden) return null;
        const r = s.getBoundingClientRect(), bs = [...s.querySelectorAll('[data-gds-go]')];
        const out = bs.filter(b => { const q = b.getBoundingClientRect(); return q.top < r.top - 1 || q.bottom > r.bottom + 1; }).map(b => b.getAttribute('data-gds-go'));
        return { out, scrolls: s.scrollHeight > s.clientHeight + 1, side: document.documentElement.scrollWidth > innerWidth, n: bs.length }; });
      check(!!fit && fit.out.length === 0 && !fit.scrolls && !fit.side, `6 ${ww}×${hh}: every symbol in sight, no scrolling, nothing sideways`, fit);
      const sb = await P.locator('#gd-strip [data-gds-go="calendar"]').boundingBox();
      if (sb) await P.mouse.move(sb.x + sb.width / 2, sb.y + sb.height / 2, { steps: 3 });
      await P.waitForTimeout(120);
      await P.screenshot({ path: path.join(OUT, `${ww}x${hh}.png`) });
      await P.keyboard.press('Escape');
      check(await until(P, () => { const s = document.getElementById('gd-strip'); return !s || s.hidden; }, null, 2000), `6 ${ww}×${hh}: Esc closes it`);
    }
    check(errors.length === 0, 'no page errors', errors.join(' | '));
  } catch (e) { check(false, 'the run finished', String(e && e.message || e)); }
  finally { await browser.close(); await h.stop(); }
  console.log(`\n${passes} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
})();
