/* NO WHITE PATCHES AT NIGHT — because there is no night: an old stored
 * night lands on the one day look, and a walk finds nothing left of it.
 *
 * Young, 4 Oct 2026, with two screenshots: *"The attached images show that
 * when in dark mode you still have white patches. Fix this across the
 * platform."* This file then measured the two pale accent rungs (accent-50,
 * accent-100) at night in both brands, and walked the platform in the dark
 * for any painted background bright enough to read as a white patch.
 *
 * RE-POINTED 21 Oct 2026 (Chambers; the owner, 20 Oct 2026: "Let's not
 * implement the dark theme. Remove it from HaTi. Only dark theme will be on
 * the explorer and brain as designed today."). The night this file guarded
 * is gone, so its claim turns into the absence of it, where the user looks:
 *   1. a reader who chose the night before (hati-dark=1, hati-theme=dark,
 *      the navy brand) opens HaTi on the day look: no dark class, no brand
 *      attribute, the old keys cleared; the two pale rungs paint exactly what
 *      :root declares and the page's ground is light; no switch to turn the
 *      night back on is published or drawn;
 *   2. a walk of the platform: on every screen the night never comes back,
 *      and no stylesheet rule anywhere is written for it (html.dark,
 *      :root.dark, a brand attribute). Explorer's and the Brain's dark stage
 *      are their own (.hb-dark, .ig-brain, .br-stagecard), not the night;
 *   3. and on those two dark stages, which stay, the old sweep still runs:
 *      nothing on them paints a white patch.
 *
 * Every driven half is guarded, so a screen that will not open REPORTS. */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');
const T = require('../tokens');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'dark-no-white-patches');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
/* Relative luminance, the same arithmetic the contrast work uses: the day
   ground must be at least BRIGHT, and on a dark stage a background at least
   BRIGHT is a white patch. */
const lum = c => {
  const m = /\(([^)]+)\)/.exec(c || ''); if (!m) return null;
  let p = m[1].replace('srgb', '').split(/[,\s/]+/).filter(Boolean).map(Number);
  if (/srgb/.test(c)) p = p.map((x, i) => i < 3 ? x * 255 : x);
  const a = p.length > 3 ? p[3] : 1;
  if (a < 0.5) return null;      /* a wash is not a patch */
  return +(((0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]) / 255).toFixed(3));
};
const BRIGHT = 0.78;

/* hex (#RRGGBB) to the rgb() a computed style reports */
const rgbOf = hex => { const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(hex || '').trim());
  return m ? `rgb(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)})` : null; };
const NIGHT_KEYS = { 'hati-dark': '1', 'hati-dark-guest': '1', 'hati-theme': 'dark', 'hati-brand': 'navy', 'hati-brand-blue-once': '1' };
const NIGHT_FNS = ['setDark', 'toggleDark', 'setTheme', 'toggleTheme', 'applyTheme', 'applyAppearance', 'setBrand', 'darkNow', 'brandNow'];

/* The sweep runs in the page: is the night on the page, and is any rule in
   any stylesheet written for it? `:root:not(.dark)` rules are DAY rules kept
   as written, so the :not() is taken out before the selector is read. A
   cross-origin sheet (the fonts) cannot be read and is not ours. */
const NIGHT = () => {
  const html = document.documentElement;
  const rules = [];
  const walk = list => { for (const r of list){
    if (r.cssRules && !r.selectorText) { try { walk(r.cssRules); } catch (_){} continue; }
    const sel = String(r.selectorText || '').replace(/:not\(\s*\.dark\s*\)/g, '');
    if (/\.dark(?![\w-])/.test(sel) || /\[data-brand/.test(sel)) rules.push(sel.slice(0, 80));
  } };
  for (const sh of document.styleSheets){ try { walk(sh.cssRules); } catch (_){} }
  return { dark: html.classList.contains('dark') || document.body.classList.contains('dark'),
    brand: html.getAttribute('data-brand'), rules };
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  const pause = ms => new Promise(r => setTimeout(r, ms));
  try {
    const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    const landed = await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 0,
      null, { timeout: 15000 }).then(() => true, () => false);
    ok('0 the workspace is open', landed);

    /* ===== 1. AN OLD STORED NIGHT LANDS ON THE DAY ===== */
    await page.evaluate(k => { for (const [n, v] of Object.entries(k)) localStorage.setItem(n, v); }, NIGHT_KEYS);
    await page.reload({ waitUntil: 'networkidle' });
    const back = await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 0,
      null, { timeout: 15000 }).then(() => true, () => false);
    ok('1-stage the workspace opens again over the old stored night', back);
    await pause(400);
    const day = await page.evaluate(fns => {
      const paint = v => { const d = document.createElement('div');
        d.style.cssText = 'position:fixed;left:-600px;top:0;width:40px;height:20px;background:var(' + v + ')';
        document.body.appendChild(d); const c = getComputedStyle(d).backgroundColor; d.remove(); return c; };
      const html = document.documentElement;
      return { dark: html.classList.contains('dark'), brand: html.getAttribute('data-brand'),
        left: ['hati-dark', 'hati-dark-guest', 'hati-theme', 'hati-brand', 'hati-brand-blue-once'].filter(k => localStorage.getItem(k) != null),
        a50: paint('--color-accent-50'), a100: paint('--color-accent-100'), ground: paint('--color-bg'),
        body: getComputedStyle(document.body).backgroundColor,
        fns: fns.filter(n => typeof window[n] === 'function'),
        btns: ['#theme-btn', '#brand-navy', '#brand-green', '[data-brand-pick]', '[data-m-act="theme"]', '[data-hb-screen]'].filter(q => document.querySelector(q)) };
    }, NIGHT_FNS);
    ok('1a a reader who chose the night lands on the day: no dark class, no brand, the old keys cleared',
      !day.dark && day.brand == null && day.left.length === 0, JSON.stringify({ dark: day.dark, brand: day.brand, left: day.left }));
    const want50 = rgbOf(T.RAW('--color-accent-50')), want100 = rgbOf(T.RAW('--color-accent-100'));
    ok('1b the two pale rungs paint exactly what :root declares, and the ground is light',
      !!want50 && day.a50 === want50 && day.a100 === want100 && day.body === day.ground && lum(day.body) >= BRIGHT,
      `50=${day.a50} (root ${want50}) · 100=${day.a100} (root ${want100}) · body ${day.body} (L ${lum(day.body)}) · ground ${day.ground}`);
    ok('1c no switch to turn the night back on is published or drawn',
      day.fns.length === 0 && day.btns.length === 0, `published ${day.fns.join(', ') || 'none'} · drawn ${day.btns.join(', ') || 'none'}`);

    /* ===== 2. A WALK OF THE PLATFORM: THE NIGHT NEVER COMES BACK ===== */
    const found = [];
    const walked = [];
    const look = async (where) => {
      const n = await page.evaluate(NIGHT);
      walked.push(where);
      if (n.dark || n.brand != null) found.push(`${where}: ${n.dark ? 'dark class' : ''}${n.brand != null ? ' data-brand=' + n.brand : ''}`);
      n.rules.forEach(r => found.push(`${where}: ${r}`));
    };
    for (const v of ['dashboard', 'register', 'redline', 'approvals', 'obligations', 'calendar',
      'templates', 'standards', 'team', 'people', 'intake', 'agents', 'brain']){
      const went = await page.evaluate(x => { try { setView(x); return true; } catch (_){ return false; } }, v);
      if (!went){ ok('2 ' + v + ' opens', false, 'setView refused'); continue; }
      await pause(1300);
      await look(v);
    }
    await page.evaluate(() => setView('intel')); await pause(1500);
    for (const t of ['portfolio', 'friction', 'obligations', 'payterms', 'exposure']){
      const went = await page.evaluate(x => { try { intelGoTab(x); return true; } catch (_){ return false; } }, t);
      if (!went){ ok('2 Insights ' + t + ' opens', false, 'intelGoTab refused'); continue; }
      await pause(1300);
      await look('intel/' + t);
    }
    const opened = await page.evaluate(() => {
      const c = state.contracts[0];
      if (!c || typeof openWorkspace !== 'function') return null;
      openWorkspace(c.id, { room: true }); return c.id;
    });
    ok('2a a contract room opens, so its tabs can be walked', !!opened, opened || 'no contract');
    if (opened){
      await pause(2500);
      for (const tab of ['terms', 'stands', 'document', 'signing', 'obligations', 'history']){
        const went = await page.evaluate(a => { try { roomGoTab(getContract(a[0]), a[1]); return true; } catch (_){ return false; } }, [opened, tab]);
        if (!went) continue;
        await pause(1400);
        await look('room/' + tab);
      }
    }
    ok('2b the walk really covered the platform', walked.length >= 20, walked.length + ' screens');
    /* A NET FOR WHAT COMES NEXT: a rule written for a night that no longer
       exists is dead weight at best, and at worst a night half come back. */
    ok('2c and on not one of them does the night come back, nor any rule written for it',
      found.length === 0, [...new Set(found)].slice(0, 6).join('  |  ') || 'none');

    await page.screenshot({ path: path.join(OUT, '1-day.png') });

    /* ===== 3. THE TWO DARK STAGES HaTi KEEPS: NO WHITE PATCH ON THEM =====
       The owner kept a dark stage on Explorer's map and on the Brain ("Only
       dark theme will be on the explorer and brain as designed today"). The
       fault this file was written for — something pale painted on a dark
       ground — can still happen there, so the old sweep runs, scoped to each
       stage. Each stage is first asked to BE dark, so the sweep measures. */
    for (const [name, open, scope] of [
      ['Explorer\'s map', () => { setView('dashboard'); hbSetFace('explorer'); }, '#hb-page.hb-dark .ig-brain, #ig-page.hb-dark .ig-brain'],
      ['the Brain\'s stage', () => { setView('brain'); }, '.br-stagecard'],
    ]){
      const went = await page.evaluate(`(() => { try { (${open})(); return true; } catch (e) { return String(e && e.message || e); } })()`);
      const drawn = went === true && await page.waitForFunction(q => { const el = document.querySelector(q); if (!el) return false;
        const r = el.getBoundingClientRect(); return r.width > 200 && r.height > 200; }, scope, { timeout: 10000 }).then(() => true, () => false);
      ok(`3-stage ${name} is drawn on its dark stage`, drawn, went === true ? (drawn ? 'drawn' : 'no ' + scope) : went);
      if (!drawn) continue;
      await pause(1500);
      const st = await page.evaluate(({ q, bright }) => {
        const lumOf = c => { const m = /\(([^)]+)\)/.exec(c || ''); if (!m) return null;
          let p = m[1].replace('srgb', '').split(/[,\s/]+/).filter(Boolean).map(Number);
          if (/srgb/.test(c)) p = p.map((x, i) => i < 3 ? x * 255 : x);
          const a = p.length > 3 ? p[3] : 1; if (a < 0.5) return null;
          return +(((0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]) / 255).toFixed(3)); };
        const stage = document.querySelector(q);
        /* the ground the stage paints: its own colour, else the first colour in its gradient */
        const cs0 = getComputedStyle(stage);
        const ground = lumOf(cs0.backgroundColor) != null ? cs0.backgroundColor
          : ((/rgba?\([^)]+\)/.exec(cs0.backgroundImage || '') || [])[0] || cs0.backgroundColor);
        const where = el => { const b = []; let n = el, d = 0;
          while (n && n.nodeType === 1 && d++ < 3){ b.unshift(n.tagName.toLowerCase() + (n.id ? '#' + n.id : '')
            + (typeof n.className === 'string' && n.className.trim() ? '.' + n.className.trim().split(/\s+/).slice(0, 3).join('.') : '')); n = n.parentElement; }
          return b.join(' > '); };
        const hits = [];
        for (const el of stage.querySelectorAll('*')){
          const r = el.getBoundingClientRect();
          /* a patch is something you SEE: a legend dot is a key, not a patch */
          if (r.width < 16 || r.height < 12 || r.width * r.height < 400) continue;
          if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
          const cs = getComputedStyle(el);
          if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
          const L = lumOf(cs.backgroundColor);
          if (L == null || L < bright) continue;
          hits.push(`${where(el)} ${cs.backgroundColor} ${Math.round(r.width)}×${Math.round(r.height)}`);
        }
        return { ground, L: lumOf(ground), hits };
      }, { q: scope, bright: BRIGHT });
      ok(`3a ${name}: the stage is dark`, st.L != null && st.L < 0.3, `ground ${st.ground} (L ${st.L})`);
      ok(`3b ${name}: nothing on it paints a white patch`, st.hits.length === 0, st.hits.slice(0, 6).join('  |  ') || 'none');
      await page.screenshot({ path: path.join(OUT, '3-' + name.replace(/\W+/g, '-').toLowerCase() + '.png') });
    }
    ok('9 no page errors', errs.length === 0, errs.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    ok('the stage ran to the end', false, e && e.message);
  } finally {
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
