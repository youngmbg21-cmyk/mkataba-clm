/* THE BOARD'S REMOTE (owner, 27 Nov 2026: "a side panel that will bring the charts that would usually appear under
   the need you card … currently hidden and would be summoned by prompting or the slash prompt"; built on "1: pick
   your choice. 2: yes. 3: yes"). js/views/homeboard.js hbRemote*, js/components.js jamboRemoteBtnHtml.

   WHAT THIS PINS, driven in a real browser on a seeded workspace, at the owner's three screens
     1 🎛️ stands FIRST in the Board's links line above Jambo's box, never left out by the fitting
     2 pressed, Jambo's panel IS the remote: its title, "N of 8 on your Board", the groups, a row per chart; the
       panel's top tab stands down as the welcome's does; the box asks for a chart
     3 a press on "Value by stage" brings that chart under Needs you, in view; its row says On
     4 a press on a ready chart ("How far contracts get") brings it too; both rows On; the count says 2
     5 the chart's own × on the Board puts it away and the remote follows (its row Bring again)
     6 a press on an On row puts its chart away
     7 eight at most: a ninth sends the oldest away and the toast says which
     8 🎛️ again: Jambo's welcome is back, the remote gone
     9 "/" in the box lists the same charts under "Charts" ("/pipe" finds "How far contracts get")
    10 nothing spills: no row of the remote wider than the panel, no page error
   AT THE PARENT (4d623f7) there is no 🎛️ and no remote: 1 fails and every driven half reports, never times out.
   Run: node test/chromium/board-remote-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  await H.seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  try {
    for (const [W, HH] of SCREENS){
      const at = ` @${W}×${HH}`;
      const page = await (await browser.newContext({ viewport: { width: W, height: HH } })).newPage();
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
        while (Date.now() - t0 < ms){ try { v = await page.evaluate(fn, arg); } catch (_){ v = null; } if (v) return v; await page.waitForTimeout(120); }
        return v; };
      const press = async (sel, what) => { if (!(await page.locator(sel).count())){ check(what + ' (nothing to press: ' + sel + ')' + at, false); return false; } await page.locator(sel).first().click(); return true; };
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
      await until(() => window.state && state.contracts && state.contracts.length > 0, null, 20000);
      await page.keyboard.press('Escape').catch(() => {});
      await page.evaluate(() => { const s = hbS(); s.panels = []; s.path = []; hbSave(); if (state.view === 'dashboard') hbSetFace('board'); else { s.face = 'board'; hbSave(); setView('dashboard'); } });
      await until(() => hbFace() === 'board' && !!document.querySelector('#ig-dock #igd-feed'), null, 12000);

      /* 1 */
      const ways = await until(() => { const w = [...document.querySelectorAll('#ig-dock .jb-ways .jb-way')]; return w.length ? w.map(b => ({ rm: b.hasAttribute('data-hb-remote'), off: b.classList.contains('is-fit-off') || getComputedStyle(b).display === 'none', t: b.textContent.trim() })) : null; });
      check('1 🎛️ stands first in the Board\'s links line, shown' + at, !!(ways && ways[0] && ways[0].rm && !ways[0].off && /\u{1F39B}/u.test(ways[0].t)), JSON.stringify(ways && ways.slice(0, 3)));
      if (!(ways && ways[0] && ways[0].rm)){ await page.close(); continue; }

      /* 2 */
      await press('#ig-dock [data-hb-remote]', '2 the remote');
      const P = await until(() => { const p = document.querySelector('#ig-dock [data-hb-rm-panel]'); if (!p) return null;
        const tab = document.querySelector('#ig-dock > .igd-head .pd-tab');
        return { t: (p.querySelector('.hb-rm-t') || {}).textContent, ct: (p.querySelector('.hb-rm-ct') || {}).textContent, rows: p.querySelectorAll('[data-hb-rm]').length,
          heads: [...p.querySelectorAll('.hb-rm-gh')].map(x => x.firstChild.textContent), tab: tab ? getComputedStyle(tab).display : 'none',
          on: document.querySelector('[data-hb-remote]').getAttribute('aria-pressed'), ph: (document.getElementById('igd-input') || {}).placeholder }; });
      check('2 pressed, Jambo\'s panel is the remote: title, "0 of 8", groups, a row per chart, 🎛️ pressed' + at,
        !!(P && P.t === 'Board remote' && /^0 of 8/.test(P.ct) && P.rows >= 14 && P.heads.includes('Ready charts') && P.on === 'true'), JSON.stringify(P));
      check('2b the panel\'s top tab stands down, as on the welcome' + at, !!(P && P.tab === 'none'), P && P.tab);
      check('2c the box asks for a chart' + at, !!(P && /chart/i.test(P.ph || '')), P && P.ph);

      /* 3 */
      await press('#ig-dock [data-hb-rm="k:val"]', '3 Value by stage');
      const v = await until(() => { const s = hbS(); const p = s.panels.find(x => x.kind === 'val'); if (!p) return null;
        const card = document.querySelector(`#hb-board [data-hb-pid="${p.id}"]`), row = document.querySelector('#ig-dock [data-hb-rm="k:val"]');
        const needs = document.querySelector('#hb-board .nd-board, #hb-board [data-nd-board], #hb-board .hb-needs');
        const r = card && card.getBoundingClientRect(), host = document.getElementById('hb-board').getBoundingClientRect();
        return card && row && row.getAttribute('aria-pressed') === 'true' ? { inView: r.top < host.bottom && r.bottom > host.top, below: needs ? needs.getBoundingClientRect().top < r.top : null } : null; });
      check('3 a press brings Value by stage under Needs you, in view; its row says On' + at, !!(v && v.inView && v.below !== false), JSON.stringify(v));

      /* 4 */
      await press('#ig-dock [data-hb-rm="g:pipe"]', '4 a ready chart');
      const g = await until(() => { const s = hbS(); const p = s.panels.find(x => x.gal === 'pipe');
        const a = document.querySelector('#ig-dock [data-hb-rm="g:pipe"]'), b = document.querySelector('#ig-dock [data-hb-rm="k:val"]'), ct = document.querySelector('#ig-dock .hb-rm-ct');
        return p && a && b && a.getAttribute('aria-pressed') === 'true' && b.getAttribute('aria-pressed') === 'true' && ct && /^2 of 8/.test(ct.textContent) ? { card: !!document.querySelector(`#hb-board [data-hb-pid="${p.id}"]`) } : null; });
      check('4 a ready chart comes too; both rows On; "2 of 8"' + at, !!(g && g.card), JSON.stringify(g));

      /* 5 */
      const pid = await page.evaluate(() => (hbS().panels.find(x => x.gal === 'pipe') || {}).id);
      const xSel = `#hb-board [data-hb-pid="${pid}"] [data-hb-act="x"]`;
      const hasX = await page.locator(xSel).count();
      if (hasX) await page.locator(xSel).first().click();
      else await page.evaluate(id => { hbPanelAct(id, 'x'); hbPaintBoard(); }, pid);
      const f = await until(() => { const a = document.querySelector('#ig-dock [data-hb-rm="g:pipe"]'); return a && a.getAttribute('aria-pressed') === 'false' && !hbS().panels.some(x => x.gal === 'pipe'); });
      check('5 the chart\'s own × puts it away and the remote follows' + (hasX ? '' : ' (× pressed by its own act)') + at, !!f);

      /* 6 */
      await press('#ig-dock [data-hb-rm="k:val"]', '6 an On row');
      const off = await until(() => { const a = document.querySelector('#ig-dock [data-hb-rm="k:val"]'); return a && a.getAttribute('aria-pressed') === 'false' && !hbS().panels.some(x => x.kind === 'val'); });
      check('6 a press on an On row puts its chart away' + at, !!off);

      /* 7 */
      const keys = await page.evaluate(() => [...document.querySelectorAll('#ig-dock [data-hb-rm^="k:"], #ig-dock [data-hb-rm^="g:"]')].map(b => b.getAttribute('data-hb-rm')).slice(0, 9));
      for (const k of keys){ await page.locator(`#ig-dock [data-hb-rm="${k}"]`).first().click(); await page.waitForTimeout(150); }
      const cap = await until(() => { const s = hbS(); const t = [...document.querySelectorAll('.toast, [role="status"], #toast-root *')].map(x => x.textContent).join(' ');
        return s.panels.length === 8 && /left the board to make room/.test(t) ? { n: s.panels.length, first: !s.panels.some(p => (p.kind === 'view' ? 'g:' + p.gal : 'k:' + p.kind) === keys[0]) } : null; });
      check('7 eight at most: a ninth sends the oldest away, and says so' + at, !!(cap && cap.first), JSON.stringify({ cap, keys: keys.length }));

      /* 8 */
      await press('#ig-dock [data-hb-remote]', '8 🎛️ again');
      const back = await until(() => !document.querySelector('#ig-dock [data-hb-rm-panel]') && !!document.querySelector('#ig-dock .hb-jb-hello') && document.querySelector('[data-hb-remote]').getAttribute('aria-pressed') === 'false');
      check('8 🎛️ again: the welcome is back, the remote gone' + at, !!back);

      /* 9 */
      if (await page.locator('#igd-input').count()){
        await page.click('#igd-input'); await page.keyboard.type('/pipe');
        const sl = await until(() => { const pop = document.getElementById('hb-askpop'); if (!pop) return null;
          return { heads: [...pop.querySelectorAll('h5')].map(x => x.textContent), rows: [...pop.querySelectorAll('.hb-pop-opt b')].map(x => x.textContent) }; });
        check('9 "/pipe" lists the chart under Charts' + at, !!(sl && sl.heads.includes('Charts') && sl.rows.includes('How far contracts get')), JSON.stringify(sl));
        await page.keyboard.press('Escape').catch(() => {});
      } else check('9 Jambo\'s box (nothing to type in)' + at, false);

      /* 10 */
      await press('#ig-dock [data-hb-remote]', '10 the remote again');
      const fit = await until(() => { const p = document.querySelector('#ig-dock [data-hb-rm-panel]'); if (!p) return null; const pr = document.getElementById('ig-dock').getBoundingClientRect();
        const wide = [...p.querySelectorAll('.hb-rm-row, .hb-rm-hd, .hb-rm-ft')].filter(r => { const b = r.getBoundingClientRect(); return b.right > pr.right + 1 || b.left < pr.left - 1; }).length;
        return { wide, scrollX: document.querySelector('#igd-feed').scrollWidth > document.querySelector('#igd-feed').clientWidth + 1 }; });
      check('10 nothing spills sideways in the remote' + at, !!(fit && !fit.wide && !fit.scrollX), JSON.stringify(fit));
      check('10b no page error' + at, errors.length === 0, errors.slice(0, 2).join(' | '));
      await page.evaluate(() => { hbRemoteToggle(false); const s = hbS(); s.panels = []; hbSave(); });
      await page.close();
    }
  } finally { await browser.close(); await h.stop?.(); }
  console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
