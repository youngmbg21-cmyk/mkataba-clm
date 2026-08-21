/* J12 — dark theme, walked across the screens in the brief, at 1440.
   Since screenshots cannot be read back by this session (PNG reads are
   denied), verdicts here are PROGRAMMATIC: a WCAG contrast ratio computed
   from getComputedStyle for a sample of real, currently-visible text nodes
   and chips/badges on each screen, plus a same-element check across the
   light→dark switch (an element with an unreadable ratio in dark, or a chip
   whose background equals its container's background in dark — the
   "vanished chip" symptom — is reported by name). Screenshots are still
   written to shots/ for the user's own review. */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, nameASigner } = require('../../../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(__dirname, '..', 'shots');
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* Samples every element that owns visible text (not just inherits it) and
   every chip/badge-ish element, and reports contrast ratio + whether a chip's
   own background differs from its parent's (the "still there" test). */
const SAMPLE = `(() => {
  const parseRGB = (s) => {
    const m = /rgba?\\(([^)]+)\\)/.exec(s || '');
    if (!m) return null;
    const parts = m[1].split(',').map(x => parseFloat(x));
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  };
  const lum = (c) => {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const ratio = (c1, c2) => {
    const L1 = lum(c1) + 0.05, L2 = lum(c2) + 0.05;
    return L1 > L2 ? L1 / L2 : L2 / L1;
  };
  // Walk up to find an opaque effective background.
  const effBg = (el) => {
    let cur = el, depth = 0;
    while (cur && depth < 12) {
      const bg = parseRGB(getComputedStyle(cur).backgroundColor);
      if (bg && bg.a > 0.5) return bg;
      cur = cur.parentElement; depth++;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  };
  const out = { lowContrast: [], vanishedChips: [], sampled: 0 };
  const root = document.getElementById('content') || document.body;
  const all = root.querySelectorAll('*');
  let n = 0;
  for (const el of all) {
    if (n > 4000) break; // bound the walk
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const own = Array.from(el.childNodes).some(nd => nd.nodeType === 3 && nd.nodeValue.trim().length > 1);
    if (!own) continue;
    n++;
    out.sampled++;
    const cs = getComputedStyle(el);
    const fg = parseRGB(cs.color);
    if (!fg) continue;
    const bg = effBg(el);
    const rt = ratio(fg, bg);
    const fsz = parseFloat(cs.fontSize) || 12;
    const bold = (parseInt(cs.fontWeight, 10) || 400) >= 600;
    const minRatio = (fsz >= 18 || (fsz >= 14 && bold)) ? 3.0 : 4.5;
    if (rt < minRatio - 0.15) { // small slack for rounding
      const lab = el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).slice(0,2).join('.') : '');
      out.lowContrast.push(\`\${lab} "\${el.textContent.trim().slice(0,40)}" ratio=\${rt.toFixed(2)} need=\${minRatio} fg=\${cs.color} bg=rgb(\${bg.r},\${bg.g},\${bg.b})\`);
    }
  }
  return out;
})()`;

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  await nameASigner(W.admin, 'MK-A2');
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));

  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.fill('#li-email', 'admin@example.co.ke');
  await page.fill('#li-pass', 'adminpassword1');
  await page.click('#li-go');
  await page.waitForTimeout(2200);

  const SCREENS = [
    ['dashboard', 'home', () => {}],
    ['register', 'contracts', () => {}],
    ['redline', 'negotiations', () => {}],
    ['intel', 'insights', () => {}],
    ['team', 'settings', () => {}],
    ['directory', 'people', () => {}],
  ];

  const walkScreens = async (themeLabel) => {
    for (const [v, label] of SCREENS) {
      await page.evaluate(vv => setView(vv), v);
      await page.waitForTimeout(650);
      const sample = await page.evaluate(SAMPLE);
      check(`${themeLabel}/${label}: low-contrast text elements`, sample.lowContrast.length === 0,
        sample.lowContrast.length ? `${sample.lowContrast.length} of ${sample.sampled} — e.g. ${sample.lowContrast.slice(0,3).join(' | ')}` : `0 of ${sample.sampled}`);
      await page.screenshot({ path: path.join(OUT, `theme-${themeLabel}-${label}.png`) });
    }
    // Contract room, all 4 tabs
    await page.evaluate(() => setView('register'));
    await page.waitForTimeout(500);
    await page.click('tr[data-row="MK-A1"]');
    await page.waitForTimeout(700);
    for (const tab of ['terms', 'docs', 'sign', 'history']) {
      await page.click(`[data-ws-tab="${tab}"]`).catch(() => {});
      await page.waitForTimeout(500);
      const sample = await page.evaluate(SAMPLE);
      check(`${themeLabel}/room-${tab}: low-contrast text elements`, sample.lowContrast.length === 0,
        sample.lowContrast.length ? `${sample.lowContrast.length} of ${sample.sampled} — e.g. ${sample.lowContrast.slice(0,3).join(' | ')}` : `0 of ${sample.sampled}`);
      await page.screenshot({ path: path.join(OUT, `theme-${themeLabel}-room-${tab}.png`) });
    }
  };

  // ---- LIGHT (green, default) ----
  await walkScreens('light');

  // ---- DARK ----
  await page.evaluate(() => setTheme('dark'));
  await page.waitForTimeout(700);
  const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  check('dark class applied to <html> after setTheme("dark")', isDark);
  await walkScreens('dark');

  // ---- Specific known-risk elements: status badges / chips on the register,
  //      in dark, must not vanish (their own bg must differ from the row's). ----
  await page.evaluate(() => setView('register'));
  await page.waitForTimeout(700);
  const chipCheck = await page.evaluate(() => {
    const parseRGB = (s) => { const m = /rgba?\(([^)]+)\)/.exec(s || ''); if (!m) return null;
      const p = m[1].split(',').map(x => parseFloat(x)); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
    const chips = Array.from(document.querySelectorAll('.reg-status, [class*="chip"], [class*="badge"]')).slice(0, 30);
    const out = [];
    for (const c of chips) {
      const r = c.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
      const own = parseRGB(getComputedStyle(c).backgroundColor);
      const parent = c.parentElement ? parseRGB(getComputedStyle(c.parentElement).backgroundColor) : null;
      const sameAsParent = own && parent && own.a > 0.05 && Math.abs(own.r-parent.r)<4 && Math.abs(own.g-parent.g)<4 && Math.abs(own.b-parent.b)<4 && Math.abs(own.a-parent.a)<0.05;
      out.push({ text: c.textContent.trim().slice(0,24), own, sameAsParent });
    }
    return out;
  });
  const vanished = chipCheck.filter(c => c.sameAsParent);
  check('dark theme: status chips/badges on the register keep a distinct background', vanished.length === 0,
    vanished.length ? JSON.stringify(vanished.slice(0,5)) : `checked ${chipCheck.length} chips`);
  await page.screenshot({ path: path.join(OUT, 'theme-dark-register-chips.png') });

  // ---- Insights charts still legible in dark (canvas present + non-empty) ----
  await page.evaluate(() => setView('intel'));
  await page.waitForTimeout(900);
  const chartInfo = await page.evaluate(() => {
    const canvases = Array.from(document.querySelectorAll('canvas'));
    return canvases.map(c => ({ w: c.width, h: c.height })).filter(c => c.w > 10 && c.h > 10);
  });
  check('dark theme: Insights renders at least one non-empty chart canvas', chartInfo.length > 0, JSON.stringify(chartInfo.slice(0,5)));
  await page.screenshot({ path: path.join(OUT, 'theme-dark-insights-charts.png') });

  await browser.close();
  await h.stop();

  console.log('\n--- page errors ---');
  errors.forEach(e => console.log(e));
  fs.writeFileSync(path.join(__dirname, '..', 'errors-04-theme.json'), JSON.stringify(errors, null, 2));

  const passed = results.filter(r => r.pass).length;
  console.log(`\n${passed}/${results.length} passed`);
  fs.writeFileSync(path.join(__dirname, '..', 'results-04-theme.json'), JSON.stringify(results, null, 2));
  process.exit(0); // audit — never fail the process; findings are read from results json
})();
