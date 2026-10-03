/* Chromium verification: EXPLORER — THE NAME, THE DIVIDER, THE LEGEND AT REST
   ============================================================
   Young ruled 27 Sep 2026: "Let's just change the name to simply Explorer.
   Also, I need for you to bring the divider that is in the document and
   negotiate pages to the Explorer page as opposed to have the arrow button
   that is on the chatbot that expands and closes the chat window. Finally,
   when you open the explorer page, the legend should always be closed as the
   resting state." And, of the one question put back: the › that folds the
   panel to a strip is KEPT; the » widen button goes.

   Every claim here is pixels or a real press: a divider is only proved by
   dragging it, and a legend is only proved closed by its rows not being on
   screen. Red at the parent (0746c11): the tab says "Contract Graph", there
   is no divider, the » is drawn, and the legend opens at rest.

   Screenshots go to test/chromium/shots/explorer/ (or HATI_SHOT_DIR).
   Run: node test/chromium/explorer-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'explorer');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const legend = () => page.evaluate(() => {
    const lg = document.getElementById('ig-legend'); if (!lg) return null;
    const row = lg.querySelector('[data-igstatus]'); const btn = lg.querySelector('[data-ig-legend-fold]');
    const rr = row && row.getBoundingClientRect();
    return { rowShown: !!(rr && rr.width > 0 && rr.height > 0), expanded: btn && btn.getAttribute('aria-expanded'),
      head: !!(lg.querySelector('[data-ig-legend-head]') && lg.querySelector('[data-ig-legend-head]').getBoundingClientRect().height > 0),
      h: Math.round(lg.getBoundingClientRect().height) };
  });
  const geo = () => page.evaluate(() => {
    const row = document.getElementById('ig-row') || (document.getElementById('ig-dock') && document.getElementById('ig-dock').parentElement), dock = document.getElementById('ig-dock'), rez = document.getElementById('ig-resizer');
    const rr = row.getBoundingClientRect(), dr = dock.getBoundingClientRect(), zr = rez ? rez.getBoundingClientRect() : null;
    return { rowW: Math.round(rr.width), dockW: Math.round(dr.width), dockLeft: Math.round(dr.left),
      handle: zr ? { hidden: rez.hidden, mid: Math.round(zr.left + zr.width / 2), w: Math.round(zr.width), top: Math.round(zr.top), bottom: Math.round(zr.bottom) } : null,
      limit: rez && rez.getAttribute('data-at-limit'), stored: localStorage.getItem('hati.v1.igDockW') };
  });

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);
    await page.evaluate(() => { try { localStorage.removeItem('hati.v1.igDockW'); } catch (_) {} intel.tab = 'frame'; setView('intel'); });
    await page.waitForTimeout(1500);

    /* ================= 1. THE NAME =========================================
       RE-POINTED IN PLACE 3 Oct 2026 (Young: "keep Insights for the detailed
       tabs"; Home is the board and the map): Explorer left the Insights row
       for Home's Board | Explorer switch. The name is the switch's word now,
       and the old key still reaches it (intelGoTab('map')). */
    const tabs = await page.evaluate(() => [...document.querySelectorAll('[data-ig-tab]')].map(b => ({ k: b.getAttribute('data-ig-tab'), t: b.textContent.trim() })));
    check('1a Insights draws no Explorer tab any more', !tabs.some(t => t.k === 'map'), JSON.stringify(tabs.map(t => t.t)));
    await page.evaluate(() => intelGoTab('map'));
    await page.waitForTimeout(1600);
    const face = await page.evaluate(() => ({ view: state.view, t: ((document.querySelector('[data-hb-face="explorer"]') || {}).textContent || '').trim(),
      on: (document.querySelector('[data-hb-face="explorer"]') || { getAttribute: () => '' }).getAttribute('aria-selected') }));
    check('1b CONTROL — the old key still lands on Explorer, on Home, and the switch reads "Explorer"',
      face.view === 'dashboard' && face.t === 'Explorer' && face.on === 'true', JSON.stringify(face));
    check('1c and "Contract Graph" is nowhere on the page', !(await page.evaluate(() => /Contract Graph/i.test(document.getElementById('content').textContent))));
    const toBoard = () => page.click('[data-hb-face="board"]');
    const toMap = () => page.click('[data-hb-face="explorer"]');

    /* ================= 2. THE LEGEND IS CLOSED WHEN YOU ARRIVE ============= */
    await toBoard(); await page.waitForTimeout(700);
    await toMap();
    await page.waitForTimeout(1600);
    const a1 = await legend();
    check('2a arriving on Explorer from the board: the legend is closed — its rows are not on screen, its head is, and it says so',
      a1 && !a1.rowShown && a1.head && a1.expanded === 'false', JSON.stringify(a1));
    await page.screenshot({ path: path.join(OUT, '01-arrived.png') });
    await page.click('#ig-legend [data-ig-legend-fold]');
    await page.waitForTimeout(300);
    const a2 = await legend();
    check('2b one press opens it for the visit', a2 && a2.rowShown && a2.expanded === 'true' && a2.h > a1.h, JSON.stringify(a2));
    /* A repaint of the tab is not an arrival: the reader's own choice holds. */
    await page.evaluate(() => renderIntel());
    await page.waitForTimeout(1200);
    const a3 = await legend();
    check('2c a repaint of the map keeps the reader\'s choice (a repaint is not an arrival)', a3 && a3.rowShown, JSON.stringify(a3));
    /* OPEN before leaving, by the reader's own press where it is not — or a
       build that only remembered the last press would pass 2d on a legend a
       press had already closed. */
    const openIt = () => page.evaluate(() => { const b = document.querySelector('#ig-legend [data-ig-legend-fold]'); if (b && b.getAttribute('aria-expanded') === 'false') b.click(); });
    await openIt(); await page.waitForTimeout(250);
    await page.evaluate(() => setView('register'));
    await page.waitForTimeout(900);
    await page.evaluate(() => { intel.tab = 'map'; setView('intel'); });
    await page.waitForTimeout(1600);
    const a4 = await legend();
    check('2d leave the page and come back: closed again', a4 && !a4.rowShown && a4.expanded === 'false', JSON.stringify(a4));
    await openIt(); await page.waitForTimeout(250);
    await toBoard(); await page.waitForTimeout(900);
    await toMap();
    await page.waitForTimeout(1600);
    const a5 = await legend();
    check('2e and via the board: closed again', a5 && !a5.rowShown, JSON.stringify(a5));

    /* ================= 2f. THE ASK BUTTON SITS IN ITS BOX =================
       Young reported it 27 Sep 2026: "the green ask button is now poorly
       designed as far as placing". A small button's own position:relative had
       beaten the class that pins it inside the box, so it fell under the box
       at the left, half off the panel. Measured as pixels: inside the box,
       centred on its line, at the box's right end. */
    const ask = await page.evaluate(() => {
      const i = document.getElementById('igd-input').getBoundingClientRect(), r = document.getElementById('igd-go').getBoundingClientRect();
      return { inside: r.left >= i.left && r.right <= i.right && r.top >= i.top && r.bottom <= i.bottom,
        off: Math.round(Math.abs((r.top + r.bottom) / 2 - (i.top + i.bottom) / 2)), gapRight: Math.round(i.right - r.right) };
    });
    check('2f the Ask button sits inside the ask box, centred on its line, at the box\'s right end',
      ask.inside && ask.off <= 1 && ask.gapRight >= 0 && ask.gapRight <= 12, JSON.stringify(ask));

    /* ================= 3. THE » IS GONE, THE › IS KEPT ===================== */
    const head = await page.evaluate(() => {
      const dock = document.getElementById('ig-dock');
      return { expand: !!dock.querySelector('#igd-expand'), collapse: !!dock.querySelector('#igd-collapse'),
        svgs: [...dock.querySelectorAll('button svg path')].some(p => /M11 17l-5-5 5-5|M13 17l5-5-5-5/.test(p.getAttribute('d') || '')) };
    });
    check('3a the » widen button is not drawn in the open panel', !head.expand && !head.svgs, JSON.stringify(head));
    check('3b CONTROL — the › that folds the panel to its strip is kept', head.collapse);

    /* ================= 4. THE DIVIDER ====================================== */
    const g0 = await geo();
    check('4a a divider stands on the seam between the column and the panel, the full height of the row',
      g0.handle && !g0.handle.hidden && Math.abs(g0.handle.mid - g0.dockLeft) <= 1 && g0.handle.w === 14 && g0.handle.bottom - g0.handle.top > 300, JSON.stringify(g0));
    /* GUARDED: a build without the divider has nothing to drag, and every
       claim below REPORTS that rather than stopping the file. */
    if (!g0.handle) {
      ['4b', '4c', '4d', '4e', '4f', '4g', '4h', '4i', '4j', '4k', '4l', '5a', '5b'].forEach(n => check(n + ' (the divider)', false, 'no divider on the page'));
      throw Object.assign(new Error('no divider'), { reported: true });
    }
    check('4b at rest the panel is the width it always opened at (380px) and nothing is stored', g0.dockW === 380 && g0.stored === null, `${g0.dockW}px · stored ${g0.stored}`);
    const hover = await page.evaluate(() => { const s = document.querySelector('#ig-resizer span'); return getComputedStyle(s).backgroundColor; });
    await page.hover('#ig-resizer'); await page.waitForTimeout(250);
    const hovered = await page.evaluate(() => { const s = document.querySelector('#ig-resizer span'); return getComputedStyle(s).backgroundColor; });
    check('4c the grip is quiet at rest and takes the accent under the pointer — the other two pages\' own look', hover !== hovered, `${hover} → ${hovered}`);
    /* A REAL DRAG: the handle follows the pointer, and the panel with it. */
    const y = Math.round((g0.handle.top + g0.handle.bottom) / 2);
    await page.mouse.move(g0.handle.mid, y); await page.mouse.down();
    await page.mouse.move(g0.handle.mid - 60, y, { steps: 6 });
    await page.mouse.move(g0.handle.mid - 160, y, { steps: 6 });
    await page.mouse.up(); await page.waitForTimeout(500);
    const g1 = await geo();
    check('4d dragging left by 160px widens the panel by 160px — the handle follows the pointer, never the distance travelled',
      Math.abs(g1.dockW - (g0.dockW + 160)) <= 2 && Math.abs(g1.handle.mid - (g0.handle.mid - 160)) <= 2, `${g0.dockW} → ${g1.dockW}px · handle ${g0.handle.mid} → ${g1.handle.mid}`);
    check('4e the width is remembered in this browser', Number(g1.stored) === g1.dockW, `stored ${g1.stored}`);
    await page.screenshot({ path: path.join(OUT, '02-dragged.png') });
    /* It survives a repaint and a return to the page. */
    await page.evaluate(() => setView('register')); await page.waitForTimeout(700);
    await page.evaluate(() => { intel.tab = 'map'; setView('intel'); }); await page.waitForTimeout(1500);
    const g2 = await geo();
    check('4f back on the page the panel keeps the width the reader chose', g2.dockW === g1.dockW, `${g2.dockW}px`);
    /* The floors hold, and a floor says so. */
    await page.mouse.move(g2.handle.mid, y); await page.mouse.down();
    await page.mouse.move(g2.handle.mid + 600, y, { steps: 8 });
    const g3 = await geo();
    await page.mouse.up(); await page.waitForTimeout(400);
    check('4g dragged far right, the panel stops at its floor (340px) and the grip marks the limit', g3.dockW === 340 && g3.limit === 'min', `${g3.dockW}px · ${g3.limit}`);
    const g3b = await geo();
    await page.mouse.move(g3b.handle.mid, y); await page.mouse.down();
    await page.mouse.move(40, y, { steps: 10 });
    const g4 = await geo();
    await page.mouse.up(); await page.waitForTimeout(400);
    check('4h dragged far left, the column beside it keeps its floor (420px) and the grip marks the limit',
      g4.rowW - g4.dockW === 420 && g4.limit === 'max', `column ${g4.rowW - g4.dockW}px · ${g4.limit}`);
    /* The keyboard: the handle is a separator a person can tab to. */
    await page.focus('#ig-resizer');
    await page.keyboard.press('Home'); await page.waitForTimeout(300);
    const k0 = await geo();
    await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(300);
    const k1 = await geo();
    check('4i Home puts it back and forgets the choice; an arrow key steps it', k0.dockW === 380 && k0.stored === null && k1.dockW > k0.dockW, `${k0.dockW} → ${k1.dockW}px`);
    await page.dblclick('#ig-resizer'); await page.waitForTimeout(400);
    const g5 = await geo();
    check('4j a double-click puts it back to where it rests', g5.dockW === 380 && g5.stored === null, `${g5.dockW}px · stored ${g5.stored}`);
    /* Folded to its strip, there is nothing to drag. */
    await page.click('#igd-collapse'); await page.waitForTimeout(600);
    const g6 = await geo();
    check('4k folded to its strip by the kept ›, the divider stands down', g6.handle && g6.handle.hidden && g6.dockW === 46, JSON.stringify(g6));
    await page.click('#igd-expand'); await page.waitForTimeout(600);
    const g7 = await geo();
    check('4l opened again, the divider is back on the seam', g7.handle && !g7.handle.hidden && Math.abs(g7.handle.mid - g7.dockLeft) <= 1, JSON.stringify(g7));

    /* ================= 5. THE DIVIDER WITH THE PAPER UP ==================== */
    await page.evaluate(() => { igExplain('MK-A2'); });
    await page.waitForTimeout(600);
    await page.evaluate(() => { const b = document.querySelector('#ig-dock [data-ig-analyze]'); if (b) b.click(); });
    await page.waitForTimeout(1000);
    const p0 = await page.evaluate(() => { const s = document.querySelector('#ig-paper .pg-sheet'); const z = document.getElementById('ig-resizer').getBoundingClientRect();
      const at = document.elementFromPoint(z.left + z.width / 2, (z.top + z.bottom) / 2);
      return { sheet: !!s, sheetW: s ? Math.round(s.getBoundingClientRect().width) : 0, onTop: !!(at && at.closest && at.closest('#ig-resizer')) }; });
    check('5a with a contract\'s paper up, the divider is still on top and pressable', p0.sheet && p0.onTop, JSON.stringify(p0));
    const gp = await geo();
    await page.mouse.move(gp.handle.mid, y); await page.mouse.down();
    await page.mouse.move(gp.handle.mid - 150, y, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(900);
    const p1 = await page.evaluate(() => { const s = document.querySelector('#ig-paper .pg-sheet'); return s ? Math.round(s.getBoundingClientRect().width) : 0; });
    const gp2 = await geo();
    check('5b dragging it gives the panel the room and the paper beside it follows', gp2.dockW > gp.dockW + 140 && p1 > 0, `panel ${gp.dockW} → ${gp2.dockW}px · sheet ${p0.sheetW} → ${p1}px`);
    await page.screenshot({ path: path.join(OUT, '03-paper-and-divider.png') });

    check('6 no page errors', errors.length === 0, errors.join(' | '));
  } catch (e) {
    if (!(e && e.reported)) check('run completed', false, (e && e.stack) || String(e));
    else check('6 no page errors', errors.length === 0, errors.join(' | '));
  } finally {
    await browser.close();
    await h.stop();
  }
  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})();
