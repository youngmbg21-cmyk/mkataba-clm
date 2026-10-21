/* Chromium verification: CHAMBERS — HaTi'S ONE LOOK, AND NO DARK MODE
   ============================================================
   The owner picked the Chambers design by name (20 Oct 2026; "Let's go within
   chambers") and then: "Let's not implement the dark theme. Remove it from
   HaTi. Only dark theme will be on the explorer and brain as designed today."

   What is measured here, every claim off the real page (computed styles,
   painted elements, the stylesheets the browser holds):
   1  an old stored "dark", Blue/Green brand and legacy theme land on light,
      and the keys are cleared; no `dark` class, no data-brand
   2  no rule in any stylesheet the browser holds needs the `dark` class
   3  the bar: white, one hairline, the word HaTi in the serif; no theme,
      brand or language control in it
   4  Home's question: left-aligned, the serif at 500, the ✦ mark; no bird,
      no hint line, the suggestions are links
   5  beside a paper: Jambo's tab carries the ✦; the paper is the serif; a
      filled button is the ink
   6  the Contracts list: a stage is a dot and a word (no wash); initials are
      outlined; the page title is the serif
   7  Explorer is the one dark face on Home, its stage as designed (the Blue
      glow, its own 4px/8px corners); the Board is light, with no Light | Dark
   8  the Brain's dark stage, its own corners
   9  the language still changes, in Settings › You
   10 the phone keeps the bird
   Red at the parent (d2b75c7): 21 of 26 — the bar is dark, the mark reads
   "Ha", the theme button and the language switch stand in it, the bird is
   everywhere, the hint lines are drawn, a stored "dark" turns the page dark.
   7c, 8a, 9a, 10a and "page errors" pass there too: they are the CONTROLS,
   what must not move (Explorer's and the Brain's stage, the language door,
   the phone's bird).

   Screenshots at the owner's three screens go to test/chromium/shots/chambers/
   (or HATI_SHOT_DIR). Run: node test/chromium/chambers-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'chambers');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  try {
    /* ================= 1. AN OLD STORED DARK LANDS ON LIGHT ================= */
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.setItem('hati-dark', '1'); localStorage.setItem('hati-dark-guest', '1');
      localStorage.setItem('hati-theme', 'dark'); localStorage.setItem('hati-brand', 'green');
      localStorage.setItem('hati-brand-blue-once', '1');
    });
    await page.reload({ waitUntil: 'networkidle' });
    const boot = await page.evaluate(() => ({
      dark: document.documentElement.classList.contains('dark'),
      brand: document.documentElement.getAttribute('data-brand'),
      keys: ['hati-dark', 'hati-dark-guest', 'hati-theme', 'hati-brand', 'hati-brand-blue-once'].filter(k => localStorage.getItem(k) !== null),
      bg: getComputedStyle(document.body).backgroundColor,
    }));
    check('1a a browser that stored "dark", Green and the legacy theme opens light: no dark class, no data-brand', !boot.dark && boot.brand === null, JSON.stringify(boot));
    check('1b the old keys are cleared once, so nothing can turn it dark again', boot.keys.length === 0, JSON.stringify(boot.keys));
    check('1c the theme setters are gone from the page', await page.evaluate(() => ['setDark', 'setBrand', 'setTheme', 'applyTheme', 'darkNow', 'toggleTheme'].every(n => typeof window[n] === 'undefined')));

    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => typeof setView === 'function' && window.state && state.contracts && state.contracts.length > 0, null, { timeout: 15000 });

    /* ================= 3. THE BAR ========================================== */
    await page.evaluate(() => { if (typeof deskGoCounter === 'function') deskGoCounter(); else setView('counter'); });
    await until(() => !!document.querySelector('#cn-page .cn-ask'));
    await until(() => { const m = document.getElementById('dk-mark'); return !!m && !m.hidden && m.getBoundingClientRect().width > 0; });
    const bar = await page.evaluate(() => {
      const t = document.getElementById('top-header'), m = document.getElementById('dk-mark'), cs = getComputedStyle(t), ms = m && getComputedStyle(m);
      const div = getComputedStyle(document.documentElement).getPropertyValue('--color-divider').trim();
      return { bg: cs.backgroundColor, edge: cs.borderBottomColor, edgeW: cs.borderBottomWidth, div, mark: m && m.textContent.trim(), markFace: ms && ms.fontFamily, markBg: ms && ms.backgroundColor,
        markShown: !!m && !m.hidden && m.getBoundingClientRect().width > 0,
        bell: (() => { const d = document.getElementById('hdr-notify-dot'); return d && !d.hidden ? getComputedStyle(d).backgroundColor : null; })(),
        theme: !!document.getElementById('theme-btn'), swatches: document.querySelectorAll('[data-brand-pick]').length, lang: !!document.getElementById('lang-switch') || document.querySelectorAll('.lang-btn').length };
    });
    check('3a the bar is white with one hairline under it', bar.bg === 'rgb(255, 255, 255)' && bar.edgeW === '1px', JSON.stringify(bar));
    check('3b the mark is the word "HaTi" in the title serif, no tile', bar.markShown && bar.mark === 'HaTi' && /^"?Source Serif 4/.test(bar.markFace) && /rgba\(0, 0, 0, 0\)|transparent/.test(bar.markBg), JSON.stringify(bar));
    check('3c no theme button, no Blue/Green swatches and no language switch in the bar', !bar.theme && bar.swatches === 0 && !bar.lang, JSON.stringify(bar));
    check('3d the bell\'s count is the ink, not amber', bar.bell === 'rgb(22, 21, 18)' || bar.bell === 'rgb(31, 77, 59)', String(bar.bell));

    /* ================= 4. HOME'S QUESTION =================================== */
    const home = await page.evaluate(() => {
      const ask = document.querySelector('#cn-page .cn-ask'), h1 = ask && ask.querySelector('h1'), hs = h1 && getComputedStyle(h1);
      const chip = document.querySelector('#cn-chips > button'), cs = chip && getComputedStyle(chip);
      return { align: ask && getComputedStyle(ask).textAlign, face: hs && hs.fontFamily, w: hs && hs.fontWeight, size: hs && hs.fontSize,
        mark: !!(ask && ask.querySelector('svg.jambo-mark')),
        /* a bird DRAWN on the page (the retired left menu still holds one, never shown on a computer) */
        birds: [...document.querySelectorAll('img.jambo-face')].filter(i => { const r = i.getBoundingClientRect(); return r.width > 0 && r.height > 0; }).length,
        hints: document.querySelectorAll('.jb-hint, .cn-hint, #ai-hint').length, perch: document.querySelectorAll('.jb-perch, .jb-bird').length,
        chip: chip ? { b: cs.borderTopWidth, bg: cs.backgroundColor, deco: cs.textDecorationLine } : null };
    });
    check('4a Home\'s question reads from the left, in the serif at 500, 28px', home.align === 'left' && /^"?Source Serif 4/.test(home.face) && home.w === '500' && home.size === '28px', JSON.stringify(home));
    check('4b the ✦ mark stands over the question; no bird anywhere on a computer', home.mark && home.birds === 0, JSON.stringify(home));
    check('4c no hint line under the box, no perch', home.hints === 0 && home.perch === 0, JSON.stringify(home));
    check('4d a suggestion is a link: no edge, no ground, underlined', !!home.chip && home.chip.b === '0px' && /rgba\(0, 0, 0, 0\)|transparent/.test(home.chip.bg) && /underline/.test(home.chip.deco), JSON.stringify(home.chip));
    for (const [w, hh] of SCREENS){ await page.setViewportSize({ width: w, height: hh }); await page.waitForTimeout(400); await page.screenshot({ path: path.join(OUT, `home-${w}x${hh}.png`) }); }
    await page.setViewportSize({ width: 1440, height: 780 });

    /* ================= 6. THE CONTRACTS LIST ================================ */
    await page.evaluate(() => { regPlaceSet({ show: 'list' }); setView('register'); });
    await until(() => !!document.querySelector('#reg-tbody tr[data-row] .reg-stg'));
    const list = await page.evaluate(() => {
      const st = document.querySelector('#reg-tbody .reg-stg'), av = document.querySelector('#reg-tbody .reg-av'), t = document.querySelector('.ct-h');
      const s = st && getComputedStyle(st), a = av && getComputedStyle(av), ts = t && getComputedStyle(t);
      return { stBg: s && s.backgroundColor, stPad: s && s.paddingLeft, dot: !!(st && st.querySelector('i')), avBg: a && a.backgroundColor, avEdge: a && a.borderTopWidth,
        title: ts && ts.fontFamily, titleW: ts && ts.fontWeight };
    });
    check('6a a stage is its dot and its word: no wash behind it, no pill padding', list.dot && /rgba\(0, 0, 0, 0\)|transparent/.test(list.stBg) && list.stPad === '0px', JSON.stringify(list));
    check('6b a counterparty\'s initials are outlined, not filled', /rgba\(0, 0, 0, 0\)|transparent/.test(list.avBg) && list.avEdge === '1px', JSON.stringify(list));
    check('6c the page title is the serif at 500', /^"?Source Serif 4/.test(list.title || '') && list.titleW === '500', JSON.stringify(list));

    /* ================= 5. BESIDE A PAPER ==================================== */
    await page.evaluate(() => regOpenContract('MK-B2'));
    await until(() => !!document.querySelector('#ig-paper .doc-surface') && !!document.querySelector('#ig-dock .pd-tab-talk'), null, 12000);
    const paper = await page.evaluate(() => {
      const s = document.querySelector('#ig-paper .doc-surface'), tab = document.querySelector('#ig-dock .pd-tab-talk');
      const btn = document.querySelector('#ig-dock .ui-btn-primary, #ig-strip .ui-btn-primary');
      return { face: s && getComputedStyle(s).fontFamily, mark: !!(tab && tab.querySelector('svg.jambo-mark')), tabBird: !!(tab && tab.querySelector('img')),
        serif: document.fonts ? document.fonts.check("500 16px 'Source Serif 4'") : null,
        fill: getComputedStyle(document.documentElement).getPropertyValue('--accent-fill').trim(), btnBg: btn && getComputedStyle(btn).backgroundColor,
        darkRules: (() => { let n = 0; const walk = rules => { for (const r of rules){ if (r.selectorText && /(^|[\s,(])(html|:root)\.dark\b/.test(r.selectorText)) n++; if (r.cssRules) walk(r.cssRules); } };
          for (const sh of document.styleSheets){ try { walk(sh.cssRules); } catch (_){} } return n; })() };
    });
    check('5a the paper you read is set in Source Serif 4, and the face is loaded at 500', /^"?Source Serif 4/.test(paper.face || '') && paper.serif === true, JSON.stringify(paper));
    check('5b Jambo\'s tab beside the paper carries the ✦ mark, not the bird', paper.mark && !paper.tabBird, JSON.stringify(paper));
    check('5c a filled button is the ink', /^#161512$/i.test(paper.fill) && (!paper.btnBg || paper.btnBg === 'rgb(22, 21, 18)'), JSON.stringify(paper));
    /* ================= 2. NO DARK RULE ANYWHERE ============================= */
    check('2a no rule in any stylesheet the browser holds asks for the dark class (Home, the list and the paper loaded)', paper.darkRules === 0, paper.darkRules);
    for (const [w, hh] of SCREENS){ await page.setViewportSize({ width: w, height: hh }); await page.waitForTimeout(500); await page.screenshot({ path: path.join(OUT, `paper-${w}x${hh}.png`) }); }
    await page.setViewportSize({ width: 1440, height: 780 });

    /* ================= 7. EXPLORER DARK, THE BOARD LIGHT ==================== */
    await page.evaluate(() => { setView('dashboard'); if (window.hbSetFace) hbSetFace('board'); });
    await until(() => { const p = document.querySelector('#ig-page, #hb-page'); return p && p.classList.contains('hb-light'); });
    const board = await page.evaluate(() => { const p = document.querySelector('#ig-page, #hb-page');
      return { light: !!p && p.classList.contains('hb-light'), dark: !!p && p.classList.contains('hb-dark'), switch: document.querySelectorAll('[data-hb-screen], .hb-scr').length,
        screenNow: typeof hbScreenNow === 'function' ? hbScreenNow() : null }; });
    check('7a the Board is light, and has no Light | Dark of its own', board.light && !board.dark && board.switch === 0 && board.screenNow === 'light', JSON.stringify(board));
    await page.evaluate(() => { if (window.hbSetFace) hbSetFace('explorer'); });
    await until(() => !!document.querySelector('.ig-brain'), null, 10000);
    const ex = await page.evaluate(() => { const p = document.querySelector('#ig-page, #hb-page'), st = document.querySelector('.ig-brain');
      const ps = p && getComputedStyle(p), ss = st && getComputedStyle(st);
      /* the corners are read on the map's own pieces (the view bar, the legend), and on the paper side
         that lives in the same wrapper (#ig-paper: Home's paper and the Contracts place), which wears Chambers */
      const vb = document.querySelector('.ig-brain .ig-viewbar'), lg = document.getElementById('ig-legend'), pp = document.getElementById('ig-paper');
      return { dark: !!p && p.classList.contains('hb-dark'), glow: ps && ps.getPropertyValue('--hb-glow').trim(), ink: ps && ps.getPropertyValue('--hb-ink').trim(),
        bg: ss && ss.backgroundImage.slice(0, 40), r: vb && getComputedStyle(vb).getPropertyValue('--radius').trim(), rl: lg && getComputedStyle(lg).getPropertyValue('--radius-lg').trim(),
        paperR: pp && getComputedStyle(pp).getPropertyValue('--radius').trim() }; });
    check('7b Explorer is dark as designed: its stage\'s gradient, the Blue glow and ink it had', ex.dark && /gradient/.test(ex.bg || '') && /^#6F9BEA$/i.test(ex.glow) && /^#E6EDF8$/i.test(ex.ink), JSON.stringify(ex));
    check('7c Explorer\'s map keeps its own corners (4px, 8px) — the hairline corners stop at its edge', ex.r === '4px' && ex.rl === '8px', JSON.stringify(ex));
    check('7d … and only the map: the paper side in the same wrapper (Home\'s paper, the Contracts place) wears Chambers\' 2px', ex.paperR === '2px', JSON.stringify(ex));
    await page.screenshot({ path: path.join(OUT, 'explorer-1440x780.png') });

    /* ================= 8. THE BRAIN ========================================= */
    await page.evaluate(() => setView('brain'));
    await until(() => !!document.querySelector('.br-stagecard'), null, 10000);
    const brain = await page.evaluate(() => { const c = document.querySelector('.br-stagecard'), s = c && getComputedStyle(c);
      return { bg: s && s.backgroundColor, radius: s && s.borderTopLeftRadius, r: s && s.getPropertyValue('--radius').trim() }; });
    check('8a the Brain\'s stage is its own dark, with its own corners', brain.bg === 'rgb(4, 25, 26)' && brain.radius === '8px' && brain.r === '4px', JSON.stringify(brain));
    await page.screenshot({ path: path.join(OUT, 'brain-1440x780.png') });

    /* ================= 9. THE LANGUAGE, IN SETTINGS › YOU =================== */
    await page.evaluate(() => setView('team'));
    const sv = await until(() => document.querySelector('[data-st-lang="sv"]'), null, 8000);
    if (sv) await page.click('[data-st-lang="sv"]');
    const lang = await until(() => typeof langId === 'function' && langId() === 'sv' ? langId() : null, null, 6000);
    check('9a the language still changes — in Settings › You, its one door', lang === 'sv', String(lang));
    await page.evaluate(() => { if (typeof langSet === 'function') langSet('en'); });

    check('page errors: none', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.stack || e);
  }

  /* ================= 10. THE PHONE KEEPS THE BIRD ========================= */
  try {
    const ph = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
    await ph.goto(h.base + '/', { waitUntil: 'networkidle' });
    const face = await ph.evaluate(() => (typeof jamboFaceHtml === 'function' ? jamboFaceHtml('hello', 28) : '').slice(0, 30));
    check('10a on the phone Jambo is still the bird', /^<img class="jambo-face/.test(face), face);
  } catch (e) { check('10a the phone run finished', false, e && e.message); }

  await browser.close(); await h.stop();
  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
