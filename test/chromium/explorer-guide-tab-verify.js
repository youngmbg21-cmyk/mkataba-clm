/* ============================================================
   THE GUIDE TAB — "ON THIS VIEW" (owner picked it by name, 19 Oct 2026)
   ============================================================
   "add a tab next to findings that is like a user guide in short which tells
   you the things you can do with the explorer" — then, of three options drawn,
   "On this view".

   Beside Jambo and Findings on Explorer, a Guide tab: the view in front and
   what it shows, three things to do on it, what every view can do, and one
   door to each other view.
     1  the tab stands after Findings, in both languages
     2  pressed, it shows the guide with no ask box and no chips; pressed again,
        Jambo is back with his box
     3  on every view the guide is that view's own: it names the view, and
        every row it lists, pressed, does exactly what typing its words does
        (same map, same lenses, same view), the guide stays up, and a row whose
        effect is now drawn reads "Showing" and presses nothing — in English
        and in Swedish
     4  a door to another view moves the map there and the guide follows
     5  "Go back one step" is grey with its reason while there is nothing to
        undo, and live after a change
     6  the guide fits Jambo's panel on the owner's three screens

   Red at the parent: there was no Guide tab.
   Screenshots go to test/chromium/shots/explorer-guide-tab/.
   Run: node test/chromium/explorer-guide-tab-verify.js */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'explorer-guide-tab');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const VIEW = ['Brain', 'Wiring', 'Floors', 'Grid', 'Timeline'];
const NAME = { en: VIEW, sv: ['Hjärna', 'Kopplingar', 'Våningar', 'Rutnät', 'Tidslinje'] };

let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  /* a fresh map on the recipe the page opened with, on view v, with the guide up or not */
  const fresh = (v, guide) => page.evaluate(([k, R, g]) => { intel.history = []; intel.tour = null; intel.busy = false; igRecipeSet(R); intel.lenses = []; intel.recipeStack = [];
    intel.fdTab = false; intel.gdTab = !!g; rebuildIntelGraph(); igSetView(k); renderIntelDock(); }, [v, R0, guide]);
  /* what the map draws now, as a comparable picture (a lens by what it holds, never its running id) */
  const pic = () => page.evaluate(() => JSON.stringify({ r: Object.assign(igRecipeNow(), { lenses: null }), v: igbCam().view, lenses: (intel.lenses || []).filter(l => l.on).map(l => l.label + ':' + l.action + ':' + (l.ids || []).slice().sort().join(',')).sort(), tour: !!intel.tour }));
  const pressTab = t => page.evaluate(k => { const b = document.querySelector(`#ig-dock [data-pd-tab="${k}"]`); if (b) b.click(); return !!b; }, t);
  let R0 = null;
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 2, null, { timeout: 15000 });
    await until(() => state.view === 'counter' || state.view === 'dashboard');
    await page.waitForTimeout(1500);
    await page.evaluate(() => { try { localStorage.removeItem('hati.v1.igViews'); } catch (_) {} intel.cam = null; intel.tab = 'map'; setView('dashboard'); hbSetFace('explorer'); });
    await until(() => hbFace() === 'explorer' && window.IG && IG.hubs && IG.hubs.length >= 2 && !!document.getElementById('igd-input'));
    R0 = await page.evaluate(() => igRecipeNow());

    for (const lang of ['en', 'sv']) {
      await page.evaluate(L => { langSet(L); renderIntel(); }, lang);
      await until(() => hbFace() === 'explorer' && !!document.getElementById('igd-input'));
      await fresh(0, false); await page.waitForTimeout(200);

      /* ================= 1. THE TAB, AFTER FINDINGS ================= */
      const tabs = await page.evaluate(() => [...document.querySelectorAll('#ig-dock [data-pd-tab]')].map(b => b.getAttribute('data-pd-tab')));
      check(`1-${lang} the tabs read Jambo · Findings · Guide (Guide last)`, tabs[0] === 'copilot' && tabs[tabs.length - 1] === 'guide' && (!tabs.includes('findings') || tabs.indexOf('findings') === tabs.length - 2), JSON.stringify(tabs));

      /* ================= 2. PRESSED, AND PRESSED AGAIN ================= */
      const pressed = await pressTab('guide');
      const up = await until(() => !!document.getElementById('ig-gd'));
      const bare = await page.evaluate(() => ({ box: !!document.getElementById('igd-input'), chips: !!document.querySelector('#ig-dock [data-ig-chips]'),
        lit: document.querySelector('#ig-dock [data-pd-tab="guide"]')?.getAttribute('aria-selected') }));
      /* RE-POINTED 22 Oct 2026 (owner: "all side panels need to have jambo entry field at the bottom"): the Guide keeps Jambo's box at its foot, still no chips */
      check(`2a-${lang} pressing Guide shows the guide, lit, Jambo's box at its foot and no chips`, pressed && !!up && bare.box && !bare.chips && bare.lit === 'true', JSON.stringify(bare));
      await pressTab('guide');
      const back = await until(() => !document.getElementById('ig-gd') && !!document.getElementById('igd-input'));
      check(`2b-${lang} pressing Guide again brings Jambo back with his box`, !!back);

      /* ================= 3. EVERY VIEW, EVERY ROW ================= */
      for (let v = 0; v < 5; v++) {
        await fresh(v, true); await page.waitForTimeout(200);
        const g = await page.evaluate(() => { const h = document.getElementById('ig-gd'); if (!h) return null;
          return { view: Number(h.querySelector('[data-ig-gd-view]')?.getAttribute('data-ig-gd-view')), here: h.querySelector('.ig-gd-hn')?.textContent || '',
            rows: [...h.querySelectorAll('[data-ig-gd]')].map(b => b.getAttribute('data-ig-gd')), mine: h.querySelectorAll('.ig-gd-rows')[0]?.querySelectorAll('[data-ig-gd]').length || 0 }; });
        check(`3a-${lang} ${VIEW[v]}: the guide names this view and lists its own rows`, !!g && g.view === v && g.here.includes(NAME[lang][v]) && g.mine >= 2,
          JSON.stringify(g && { view: g.view, here: g.here, mine: g.mine }));
        for (const q of (g ? g.rows : [])) {
          if (/^(undo|ångra)$/i.test(q)) continue;
          await fresh(v, true); await page.waitForTimeout(150);
          const before = await pic();
          const n = await page.evaluate(() => intel.history.length);
          await page.evaluate(w => { const b = [...document.querySelectorAll('#ig-gd [data-ig-gd]')].find(x => x.getAttribute('data-ig-gd') === w); if (b) b.click(); }, q);
          await until(k => !intel.busy && intel.history.length >= k + 1, n); await page.waitForTimeout(250);
          const viaRow = await pic();
          const after = await page.evaluate(w => ({ guide: !!document.getElementById('ig-gd'),
            live: [...document.querySelectorAll('#ig-gd [data-ig-gd]')].some(x => x.getAttribute('data-ig-gd') === w),
            on: [...document.querySelectorAll('#ig-gd .ig-gd-row.is-on')].map(x => x.textContent) }), q);
          await fresh(v, false); await page.waitForTimeout(150);
          const m = await page.evaluate(() => intel.history.length);
          await page.evaluate(w => intelAsk(w), q);
          await until(k => !intel.busy && intel.history.length >= k + 1, m); await page.waitForTimeout(250);
          const viaTyping = await pic();
          check(`3b-${lang} ${VIEW[v]} "${q}": the row does what typing it does, the guide stays, and it then reads Showing`,
            viaRow === viaTyping && viaRow !== before && after.guide && !after.live && after.on.length >= 1,
            viaRow === viaTyping ? JSON.stringify(after) : `row ${viaRow} | typed ${viaTyping}`);
        }
      }

      /* ================= 4. A DOOR TO ANOTHER VIEW ================= */
      await fresh(2, true); await page.waitForTimeout(200);
      await page.evaluate(() => document.querySelector('#ig-gd [data-ig-gd-view-go="3"]')?.click());
      const moved = await until(() => igbCam().view === 3 && Number(document.querySelector('#ig-gd [data-ig-gd-view]')?.getAttribute('data-ig-gd-view')) === 3);
      check(`4-${lang} Floors → the Grid door moves the map and the guide follows`, !!moved);

      /* ================= 5. GO BACK ONE STEP ================= */
      await fresh(2, true); await page.waitForTimeout(200);
      const dead = await page.evaluate(() => { const b = [...document.querySelectorAll('#ig-gd [data-ig-gd]')].find(x => /^(undo|ångra)$/i.test(x.getAttribute('data-ig-gd'))); return b ? { d: b.disabled, t: b.title } : null; });
      await page.evaluate(() => document.querySelector('#ig-gd .ig-gd-rows [data-ig-gd]')?.click());
      await until(() => !intel.busy && (intel.recipeStack || []).length > 0); await page.waitForTimeout(250);
      const live = await page.evaluate(() => { const b = [...document.querySelectorAll('#ig-gd [data-ig-gd]')].find(x => /^(undo|ångra)$/i.test(x.getAttribute('data-ig-gd'))); return b ? !b.disabled : null; });
      check(`5-${lang} "Go back one step" is grey with its reason before any change, live after one`, !!dead && dead.d && !!dead.t && live === true, JSON.stringify({ dead, live }));
    }
    await page.evaluate(() => { langSet('en'); renderIntel(); });
    await until(() => hbFace() === 'explorer' && !!document.getElementById('igd-input'));

    /* ================= 6. THE OWNER'S THREE SCREENS ================= */
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: hh });
      await fresh(2, true); await page.waitForTimeout(400);
      const fit = await page.evaluate(() => { const g = document.getElementById('ig-gd'), dock = document.getElementById('ig-dock'); if (!g || !dock) return null;
        const d = dock.getBoundingClientRect(), rs = [...g.querySelectorAll('.ig-gd-row,.ig-gd-others button,.ig-gd-here')].map(x => x.getBoundingClientRect());
        return { inside: rs.every(r => r.left >= d.left - 0.5 && r.right <= d.right + 0.5), sideways: g.scrollWidth > g.clientWidth + 1, scrolls: g.scrollHeight > g.clientHeight, n: rs.length }; });
      check(`6 ${w}×${hh} the guide fits Jambo's panel (no sideways scroll; it scrolls down if long)`, !!fit && fit.inside && !fit.sideways && fit.n >= 8, JSON.stringify(fit));
      await page.screenshot({ path: path.join(OUT, `${w}x${hh}-floors.png`) });
    }
    check('9 no page errors', !errors.length, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e.stack || e.message);
  } finally {
    await browser.close().catch(() => {});
    if (h.stop) await h.stop().catch(() => {});
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
