/* ============================================================
   JAMBO'S SUGGESTIONS FOLLOW THE VIEW (owner, 19 Oct 2026)
   ============================================================
   "ensure that the predesigned questions are related to the page you are on
   and not related to a different explorer view like being in brain and being
   given questions related to floors."

   On Explorer the chips under Jambo's greeting belong to the view in front:
   two of its own questions, then Explain this view, in the reader's language.
     1  each view (Brain, Wiring, Floors, Grid, Timeline) offers its own two
        and Explain this view, and nothing that belongs to another view —
        in English and in Swedish; pressing the view bar repaints them
     2  every chip, pressed, does what it says on that view, without Jambo's
        model (the lobes shade or size, the party's reach or the single-party
        lens, the floors divide, the cells shade or the grid turns, the date
        line or the then-and-now, the walk)
     3  a chip asks only for what is not drawn already: floors by payment
        terms are offered other facts
     4  the chips fit Jambo's panel on the owner's three screens

   Red at the parent: the same three chips stood on every view ("Divide the
   floors by payment terms" on the Brain), and in Swedish they were English.
   Screenshots go to test/chromium/shots/explorer-chips-follow-the-view/.
   Run: node test/chromium/explorer-chips-follow-the-view-verify.js */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'explorer-chips-follow-the-view');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

/* each view's own questions, in both languages; "own" means its family and no other's */
const FAMILY = [
  /lobes|loberna/i,
  /depends on|single-sourced|beror på|enda part/i,
  /floors|våningarna/i,
  /cells|rutorna|\bagainst\b|\bmot\b/i,
  /end by|changed since|löper ut|ändrats sedan/i,
];
const VIEW = ['Brain', 'Wiring', 'Floors', 'Grid', 'Timeline'];
const TOUR = { en: 'Explain this view', sv: 'Förklara vyn' };

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
  const chips = () => page.evaluate(() => [...document.querySelectorAll('#ig-dock [data-ig-chips] [data-igsug]')].map(b => b.getAttribute('data-igsug')));
  const pressView = v => page.evaluate(k => { const b = [...document.querySelectorAll(`[data-ig-view="${k}"]`)].find(x => x.getClientRects().length); if (b) b.click(); return !!b; }, v);
  /* a fresh panel on the recipe the page opened with, on view v */
  const fresh = v => page.evaluate(([k, R]) => { intel.history = []; intel.tour = null; intel.busy = false; igRecipeSet(R); intel.lenses = [];
    rebuildIntelGraph(); igSetView(k); renderIntelDock(); }, [v, R0]);
  let R0 = null;
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 5, null, { timeout: 15000 });
    /* signing in lands on Home's counter first; Explorer is opened once that has settled */
    await until(() => state.view === 'counter' || state.view === 'dashboard');
    await page.waitForTimeout(1500);
    await page.evaluate(() => { try { localStorage.removeItem('hati.v1.igViews'); } catch (_) {} intel.cam = null; intel.tab = 'map'; setView('dashboard'); hbSetFace('explorer'); });
    await until(() => hbFace() === 'explorer' && window.IG && IG.hubs && IG.hubs.length >= 2 && !!document.getElementById('igd-input'));
    R0 = await page.evaluate(() => igRecipeNow());

    for (const lang of ['en', 'sv']) {
      if (lang === 'sv') { await page.evaluate(() => { langSet('sv'); renderIntel(); }); await until(() => hbFace() === 'explorer' && !!document.querySelector('#ig-dock [data-ig-chips]')); }
      await page.evaluate(() => { intel.history = []; renderIntelDock(); });

      /* ================= 1. EACH VIEW'S OWN QUESTIONS ================= */
      for (let v = 0; v < 5; v++) {
        const pressed = await pressView(v);
        await until(k => igbCam().view === k, v);
        const c = await chips();
        const own = c.slice(0, -1);
        const others = FAMILY.filter((_, i) => i !== v);
        check(`1${'abcde'[v]}-${lang} ${VIEW[v]}: the view bar repaints the chips — its own questions, then "${TOUR[lang]}"`,
          pressed && c.length >= 2 && c[c.length - 1] === TOUR[lang] && own.length >= 1
            && own.every(q => FAMILY[v].test(q) && !others.some(re => re.test(q))), JSON.stringify(c));
      }
      if (lang === 'sv') check('1f-sv no chip is left in English', !(await (async () => { const all = [];
        for (let v = 0; v < 5; v++) { await pressView(v); await until(k => igbCam().view === k, v); all.push(...await chips()); }
        return all.filter(q => /\b(?:the|by|what|which|contracts|explain)\b/i.test(q)).length; })()));

      /* ================= 2. EVERY CHIP DOES WHAT IT SAYS ================= */
      for (let v = 0; v < 5; v++) {
        await fresh(v);
        const list = await chips();
        for (const q of list) {
          await fresh(v);
          const n = await page.evaluate(() => intel.history.length);
          const hit = await page.evaluate(t => { const b = [...document.querySelectorAll('#ig-dock [data-ig-chips] [data-igsug]')].find(x => x.getAttribute('data-igsug') === t); if (b) b.click(); return !!b; }, q);
          await until(k => !intel.busy && (intel.history.length >= k + 1 || !!intel.tour), n);
          await page.waitForTimeout(250);
          const s = await page.evaluate(() => ({ view: igbCam().view, lobeShade: intel.lobeShade, lobeSize: intel.lobeSize, shadeBy: intel.shadeBy,
            lenses: intel.lenses.map(l => l.label), floorKey: IG && IG.floorKey, colKey: IG && IG.colKey, tlUntil: intel.tlUntil, asOf: intel.asOf, tour: !!intel.tour,
            ai: intel.history.some(m => m && m.role === 'assistant' && /no ai key|ingen ai-nyckel|not configured|inte konfigurerad/i.test(String(m.text || ''))) }));
          let ok = false;
          if (q === TOUR[lang]) ok = s.tour;
          else if (/lobes|loberna/i.test(q)) ok = /value|värde|size|växa/i.test(q) ? s.lobeSize === 'value' : !!s.lobeShade;
          else if (/depends on|beror på/i.test(q)) ok = s.view === 1 && s.lenses.length > 0;
          else if (/single-sourced|enda part/i.test(q)) ok = s.view === 1;
          else if (/floors|våningarna/i.test(q)) ok = s.floorKey === (/payment|betalning/i.test(q) ? 'payterms' : /risk/i.test(q) ? 'risk' : /liability|ansvar/i.test(q) ? 'liability' : 'expiry');
          else if (/cells|rutorna/i.test(q)) ok = s.shadeBy === 'value';
          else if (/against|\bmot\b/i.test(q)) ok = s.view === 3 && !!s.colKey && !!s.floorKey && s.colKey !== s.floorKey;
          else if (/end by|löper ut/i.test(q)) ok = !!s.tlUntil;
          else if (/changed since|ändrats sedan/i.test(q)) ok = !!s.asOf;
          check(`2-${lang} ${VIEW[v]} "${q}" does what it says, without Jambo's model`, hit && ok && !s.ai, JSON.stringify(s));
        }
      }
    }

    /* ================= 3. ONLY WHAT IS NOT DRAWN ALREADY ================= */
    await page.evaluate(() => { langSet('en'); renderIntel(); });
    await until(() => hbFace() === 'explorer' && !!document.querySelector('#ig-dock [data-ig-chips]'));
    await page.evaluate(() => { intel.history = []; intel.floorsBy = 'payterms'; rebuildIntelGraph(); igSetView(2); renderIntelDock(); });
    const c3 = await chips();
    check('3a floors already by payment terms are offered other facts, not payment terms again',
      c3.length >= 2 && !c3.some(q => /payment terms/i.test(q)) && c3.some(q => /floors/i.test(q)), JSON.stringify(c3));
    await page.evaluate(() => { intel.history = []; intel.floorsBy = null; intel.lobeShade = 'liability'; rebuildIntelGraph(); igSetView(0); renderIntelDock(); });
    const c3b = await chips();
    check('3b lobes already shaded by the liability cap are offered another fact', !c3b.some(q => /liability/i.test(q)) && c3b.some(q => /lobes/i.test(q)), JSON.stringify(c3b));
    await page.evaluate(() => { intel.lobeShade = null; rebuildIntelGraph(); renderIntelDock(); });
    /* the single-party question waits for a role to judge: with none filled in it is not offered;
       give every live agreement a role (one party alone in its stream as a supplier) and it is */
    const c3c0 = await page.evaluate(() => { intel.history = []; igSetView(1); renderIntelDock(); return [...document.querySelectorAll('#ig-dock [data-ig-chips] [data-igsug]')].map(b => b.getAttribute('data-igsug')); });
    const judged0 = await page.evaluate(() => igSoleData(null).judged);
    check('3c with no role filled in, Wiring does not offer the single-party question (nothing could be judged)',
      judged0 > 0 || !c3c0.some(q => /single-sourced/i.test(q)), JSON.stringify({ judged0, c3c0 }));
    for (const lang of ['en', 'sv']) {
      const r = await page.evaluate(L => { langSet(L); (state.contracts || []).forEach(c => { if (c && !c.archived) c.metadata = Object.assign({}, c.metadata || {}, { category: 'supplier' }); });
        intel.history = []; intel.lenses = []; rebuildIntelGraph(); igSetView(1); renderIntelDock();
        const sole = i18t('int_sug_sole'), list = [...document.querySelectorAll('#ig-dock [data-ig-chips] [data-igsug]')].map(b => b.getAttribute('data-igsug'));
        const b = [...document.querySelectorAll('#ig-dock [data-ig-chips] [data-igsug]')].find(x => x.getAttribute('data-igsug') === sole); if (b) b.click();
        return { sole, list, pressed: !!b, ids: igSoleData(null).ids.length }; }, lang);
      await until(() => !intel.busy && intel.history.length >= 2);
      const lens = await page.evaluate(() => intel.lenses.map(l => l.label));
      check(`3d-${lang} once roles are filled in, Wiring offers "${r.sole}" and it lights the single-party contracts`,
        r.pressed && (r.ids === 0 || lens.length > 0), JSON.stringify({ list: r.list, ids: r.ids, lens }));
    }
    await page.evaluate(() => { langSet('en'); renderIntel(); });
    await until(() => hbFace() === 'explorer' && !!document.querySelector('#ig-dock [data-ig-chips]'));

    /* ================= 4. THE OWNER'S THREE SCREENS ================= */
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: hh });
      for (const v of [0, 1]) {
        await fresh(v); await page.waitForTimeout(400);
        const fit = await page.evaluate(() => { const box = document.querySelector('#ig-dock [data-ig-chips]'), dock = document.getElementById('ig-dock'), inp = document.getElementById('igd-input');
          if (!box || !dock || !inp) return null; const b = box.getBoundingClientRect(), d = dock.getBoundingClientRect(), i = inp.getBoundingClientRect();
          const bs = [...box.querySelectorAll('[data-igsug]')].map(x => x.getBoundingClientRect());
          return { inside: bs.every(r => r.left >= d.left - 0.5 && r.right <= d.right + 0.5), aboveBox: b.bottom <= i.top + 0.5, n: bs.length }; });
        check(`4 ${w}×${hh} ${VIEW[v]}: the chips sit inside Jambo's panel, above the box`, !!fit && fit.inside && fit.aboveBox && fit.n >= 2, JSON.stringify(fit));
        await page.screenshot({ path: path.join(OUT, `${w}x${hh}-${VIEW[v].toLowerCase()}.png`) });
      }
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
