/* Chromium verification: THE BRAIN (Young ruled 27 Sep 2026: "Now go build and
   merge to main. Put it as a page before home").
   ====================================================================
   f400 pins what the code SAYS and what the server READS. This file measures
   what a reader SEES and DOES on the real app: the door above Home, the brain
   actually painted (pixels, not markup), the three views, a flow pressed and
   its steps named, the zoom, a neuron hovered, the side panel scrolling inside
   the stage's own height, the code updates read off the server, and a second
   language.
   Every claim is GATED on the thing it measures being on the page, so a build
   without the feature REPORTS its failures rather than timing out.
   AT THE PARENT (972d681) every check but the page-error sweep FAILS: there is
   no door and no page.
   Run: node test/chromium/brain-page-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'brain-page');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForSelector('#su-org', { timeout: 15000 });
    await page.fill('#su-org', 'Highland Corporate Ltd'); await page.fill('#su-name', 'Young Mbagaya');
    await page.fill('#su-email', 'admin@example.co.ke'); await page.fill('#su-pass', 'adminpassword1');
    const sample = await page.$('#su-sample'); if (sample && !(await sample.isChecked())) await sample.check();
    await page.click('#su-go'); await page.waitForTimeout(3500); await page.keyboard.press('Escape').catch(() => {});
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) { await en.click(); await page.waitForTimeout(800); }

    /* ---- 1. the door, above Home ---- */
    /* RE-POINTED 29 Sep 2026 (Young: "move the Brain tab in the nav panel to
       be the last tab below team and settings"). */
    const doors = await page.evaluate(() => [...document.querySelectorAll('#side-nav .nav-item[data-view]')].map(b => b.getAttribute('data-view')));
    ok('1a the Brain is the last door in the menu, directly under Settings & Rules',
      doors[doors.length - 1] === 'brain' && doors[doors.length - 2] === 'team' && doors[0] === 'dashboard', doors.join(' · '));
    const iconBox = await page.evaluate(() => { const u = document.querySelector('[data-view="brain"] use'); try { const b = u.getBBox(); return b.width * b.height; } catch (_) { return 0; } });
    ok('1b its symbol paints (the sprite has it)', iconBox > 20, 'box ' + Math.round(iconBox));
    ok('1c HaTi still opens on Home', await page.evaluate(() => state.view === 'dashboard'));
    const door = await page.$('[data-view="brain"]');
    if (door) await door.click();
    await page.waitForTimeout(2200);
    const onPage = await page.evaluate(() => state.view === 'brain' && !!document.getElementById('br-cv'));
    ok('1d pressing it opens the Brain page', onPage);
    ok('1e the shell names the page', onPage && await page.evaluate(() => (document.getElementById('shell-title') || {}).textContent || '').then(t => /Brain/.test(t)));

    if (onPage){
      /* ---- 2. the brain is painted ---- */
      const lit = await page.evaluate(() => {
        const cv = document.getElementById('br-cv'), g = cv.getContext('2d'), d = g.getImageData(0, 0, cv.width, cv.height).data;
        let n = 0; for (let i = 3; i < d.length; i += 16) if (d[i] > 40) n++;
        return n;
      });
      ok('2a neurons are really drawn on the canvas (painted pixels, not markup)', lit > 2000, lit + ' lit samples');
      await page.screenshot({ path: path.join(OUT, '1-brain.png') });
      const t1 = await page.$eval('#br-ov-t', e => e.textContent);
      ok('2b it opens on the Brain view', /Brain view/.test(t1), t1);

      /* ---- 3. a flow ---- */
      const flows = await page.$$eval('[data-br-flow]', b => b.map(x => x.getAttribute('data-br-flow')));
      /* PIN THE RELATION, NOT THE NUMBER: every flow in the catalogue is offered
         (six until 9 Oct 2026, when the overnight review's six joined them). */
      const nFlows = await page.evaluate(() => BRAIN_FLOWS.length);
      ok('3a every process flow in the catalogue is offered', flows.length === nFlows && nFlows >= 12, flows.join(','));
      await page.click('[data-br-flow="sign"]');
      await page.waitForTimeout(400);
      const s1 = await page.$eval('#br-fl-title', e => e.textContent);
      const steps = await page.$$eval('.br-st', b => b.length);
      ok('3b pressing a flow shows its steps', /Sign the contract/.test(s1) && steps === 9, s1 + ' · ' + steps + ' steps');
      await page.waitForTimeout(4200);
      const landed = await page.evaluate(() => { const n = document.querySelector('.br-st.is-now .br-st-k'); return n ? +n.textContent : 0; });
      ok('3c the flow moves on to the next step by itself', landed >= 2, 'now at step ' + landed);
      const cap = await page.$eval('#br-cap-t', e => e.textContent);
      ok('3d the caption on the brain says the step in words', cap.length > 20, cap.slice(0, 80));
      await page.click('.br-st[data-br-step="5"]');
      await page.waitForTimeout(200);
      const jumped = await page.evaluate(() => { const n = document.querySelector('.br-st.is-now .br-st-k'); return n ? +n.textContent : 0; });
      ok('3e pressing a step plays from that step', jumped === 6, 'now at step ' + jumped);
      await page.screenshot({ path: path.join(OUT, '2-flow.png') });

      /* ---- 4. the three views ---- */
      await page.click('[data-br-view="1"]'); await page.waitForTimeout(1500);
      const t2 = await page.$eval('#br-ov-t', e => e.textContent);
      const codeTag = await page.$$eval('.br-tag-code', t => t.length);
      ok('4a Wiring: the view changes and the steps carry the code names', /Wiring/.test(t2) && codeTag > 0, t2 + ' · ' + codeTag + ' code tags');
      await page.screenshot({ path: path.join(OUT, '3-wiring.png') });
      await page.keyboard.press('3'); await page.waitForTimeout(1500);
      const t3 = await page.$eval('#br-ov-t', e => e.textContent);
      ok('4b Floors, by the key 3', /Floors/.test(t3), t3);
      await page.screenshot({ path: path.join(OUT, '4-floors.png') });
      await page.keyboard.press('1'); await page.waitForTimeout(600);

      /* ---- 5. zoom ---- */
      await page.click('#br-zin'); await page.waitForTimeout(100);
      const z1 = await page.$eval('#br-zfit', e => e.textContent);
      const box = await page.$eval('#br-cv', e => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
      await page.mouse.move(box.x, box.y); await page.mouse.wheel(0, -300); await page.waitForTimeout(150);
      const z2 = await page.$eval('#br-zfit', e => e.textContent);
      ok('5a the + button and the wheel both zoom', z1 === '140%' && parseInt(z2) > 140, z1 + ' then ' + z2);
      await page.evaluate(() => { const c = document.getElementById('br-cv'), r = c.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const ev = (t, id, x, y) => c.dispatchEvent(new PointerEvent(t, { pointerId: id, pointerType: 'touch', clientX: x, clientY: y, bubbles: true }));
        document.getElementById('br-zfit').click();
        ev('pointerdown', 11, cx - 40, cy); ev('pointerdown', 12, cx + 40, cy);
        for (let k = 1; k <= 6; k++){ ev('pointermove', 11, cx - 40 - k * 10, cy); ev('pointermove', 12, cx + 40 + k * 10, cy); }
        ev('pointerup', 11, cx - 100, cy); ev('pointerup', 12, cx + 100, cy); });
      const z3 = await page.$eval('#br-zfit', e => e.textContent);
      ok('5b a two-finger pinch zooms (the iPad)', parseInt(z3) > 200, z3);
      await page.click('#br-zfit');
      ok('5c the middle button goes back to the whole brain', await page.$eval('#br-zfit', e => e.textContent) === '100%');

      /* ---- 6. a neuron, hovered ---- */
      const hub = await page.evaluate(() => { const r = document.getElementById('br-cv').getBoundingClientRect();
        const b = window.__brHub = null; return r ? { x: r.x, y: r.y } : null; });
      let tipShown = false;
      if (hub){
        await page.click('#br-rot');   // hold it still to point at it
        for (let yy = 120; yy < 560 && !tipShown; yy += 14){
          for (let xx = 200; xx < 900 && !tipShown; xx += 14){
            await page.mouse.move(hub.x + xx, hub.y + yy);
            tipShown = await page.$eval('#br-tip', e => !e.hidden);
          }
        }
      }
      const tipText = tipShown ? await page.$eval('#br-tip', e => e.textContent) : '';
      ok('6a pointing at a named part shows its card: name, code name, where it lives', tipShown && /line \d+/.test(tipText), tipText.slice(-90));

      /* ---- 7. the side panel ---- */
      const pan = await page.evaluate(() => { const p = document.getElementById('br-panel'), s = document.querySelector('.br-stagecard');
        return { oy: getComputedStyle(p).overflowY, ph: Math.round(p.getBoundingClientRect().height), sh: Math.round(s.getBoundingClientRect().height), sc: p.scrollHeight > p.clientHeight }; });
      ok('7a the side panel scrolls inside the stage card\'s own height', pan.oy === 'auto' && Math.abs(pan.ph - pan.sh) <= 2 && pan.sc, JSON.stringify(pan));

      /* ---- 7b. the whole screen (Young, 27 Sep 2026: "Make the brain page fill the whole screen") ---- */
      for (const [vw, vh] of [[1440, 900], [1920, 1080], [1366, 1024]]){
        await page.setViewportSize({ width: vw, height: vh }); await page.waitForTimeout(500);
        const fit = await page.evaluate(() => { const sc = document.getElementById('content-scroll'), c = document.querySelector('.br-stagecard'), p = document.getElementById('br-panel'), h = document.getElementById('page-head');
          const cb = c.getBoundingClientRect(), pb = p.getBoundingClientRect();
          return { win: innerHeight, cardBot: Math.round(cb.bottom), panBot: Math.round(pb.bottom), head: Math.round(h.getBoundingClientRect().height), scroll: sc.scrollHeight - sc.clientHeight }; });
        ok(`7b the stage and the panel reach the bottom of the screen with nothing to scroll (${vw}×${vh})`, fit.scroll === 0 && fit.head === 0 && fit.win - fit.cardBot <= 16 && fit.win - fit.panBot <= 16, JSON.stringify(fit));
      }
      await page.setViewportSize({ width: 1440, height: 900 }); await page.waitForTimeout(400);

      /* ---- 8. the code updates, read off the server ---- */
      await page.waitForFunction(() => !!document.querySelector('[data-br-upd]') || /could not/.test((document.getElementById('br-upds') || {}).textContent || ''), null, { timeout: 8000 }).catch(() => {});
      const upd = await page.$$eval('[data-br-upd]', b => b.map(x => x.textContent));
      ok('8a the first reading of the code is listed as an update', upd.length === 1 && /First reading of the code/.test(upd[0]) && /\d+ parts · \d+ links · \d+ published names/.test(upd[0]), upd[0] && upd[0].slice(0, 140));
      const counts = await page.$eval('#br-ov-s', e => e.textContent);
      ok('8b the head counts neurons and parts, and says which reading it drew from', /neurons · \d+ named parts · read from/.test(counts), counts);
      const chip = await page.$eval('#br-chip-new', e => e.hidden);
      ok('8c no "new parts" chip on a baseline — nothing is new on a first reading', chip === true);

      /* ---- 9. a second language ---- */
      const sv = await page.$('.lang-btn[data-lang="sv"]');
      if (sv){ await sv.click(); await page.waitForTimeout(1200); }
      const svText = await page.evaluate(() => (document.querySelector('[data-view="brain"] [data-i18n="nav_brain"]') || {}).textContent + ' | ' + ((document.querySelector('[data-br-flow="sign"] b') || {}).textContent || ''));
      ok('9a in Swedish the door and the flows speak Swedish', /Hjärnan/.test(svText) && /Signera avtalet/.test(svText), svText);
      await page.screenshot({ path: path.join(OUT, '5-swedish.png') });
      if (en) { await page.click('.lang-btn[data-lang="en"]'); await page.waitForTimeout(600); }

      /* ---- 10. leaving stops the loop ---- */
      await page.click('[data-view="dashboard"]'); await page.waitForTimeout(500);
      const stopped = await page.evaluate(() => state.view === 'dashboard' && !document.getElementById('br-cv'));
      ok('10a leaving the page takes the brain down', stopped);
    }
    ok('the page threw nothing', errs.length === 0, errs.join(' | ') || 'no page errors');
  } catch (e) {
    ok('the bench ran to the end', false, String(e).slice(0, 300));
  } finally {
    await browser.close();
    await h.stop();
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  }
})();
