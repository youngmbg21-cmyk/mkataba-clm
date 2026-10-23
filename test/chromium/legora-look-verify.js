/* Chromium verification: THE LEGORA LOOK — HaTi'S ONE LOOK, AND NO DARK MODE
   ============================================================
   THE LEGORA LOOK (owner, 23 Oct 2026: "i want to apply this across all the
   pages in hati", off their own drawing "Hati concept inspired by Legora";
   "1, yes" to replacing Chambers; Explorer "stay dark"). Was chambers-verify.js:
   the claims Chambers and the new look share are kept (no dark mode, the serif
   question and titles, a status as a dot and a word, outlined initials, links
   for suggestions, Explorer and the Brain dark, the language door, the phone's
   bird); the ones the new look reverses are re-pointed and marked LEGORA; and
   12 measures what the new look adds (pills, filled tabs, the frosted bar,
   Jambo's coloured edge, the two halves floating as white cards).
   RED AT THE PARENT (4733092, Chambers): 3a, 3d, 5c, 7d, 11c, 11d, 11i, 11j
   and all of 12 — what the new look changed. The rest hold there: they are the
   claims the two looks share, and the controls.
   ---- what follows is Chambers' own header, kept for the record ----
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
   11 the rest of the platform (owner, 21 Oct 2026: "Finish everything"):
      a count beside a head is a plain number; a status in Jambo's panel has
      its dot; no docked panel shadow; a tag's corner is the hairline's; the
      Board's lines are the warm divider and Jambo's words sit on the warm
      box; our new words on the paper sit on the green wash; the other side's
      page wears the serif title, the dotted status, an unboxed turn and the
      word HaTi; the public status page wears the one look. RED at b9d887d
      (Chambers before this pass): all ten of 11a–11j.
   Red at the parent (d2b75c7): 21 of 26 — the bar is dark, the mark reads
   "Ha", the theme button and the language switch stand in it, the bird is
   everywhere, the hint lines are drawn, a stored "dark" turns the page dark.
   7c, 8a, 9a, 10a and "page errors" pass there too: they are the CONTROLS,
   what must not move (Explorer's and the Brain's stage, the language door,
   the phone's bird).

   Screenshots at the owner's three screens go to test/chromium/shots/chambers/
   (or HATI_SHOT_DIR). Run: node test/chromium/legora-look-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'legora-look');
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
    /* LEGORA: the bar is frosted white, its edge a soft line drawn as a shadow, not a border */
    const barSh = await page.evaluate(() => { const t = getComputedStyle(document.getElementById('top-header')); return { sh: t.boxShadow, blur: t.backdropFilter || t.webkitBackdropFilter }; });
    /* no blur: nothing scrolls under the bar, and a filter would trap its menus (Recent) under the page */
    check('3a the bar is the drawing\'s translucent white with a soft line under it, no hairline border, no filter', bar.bg === 'rgba(255, 255, 255, 0.78)' && (bar.edgeW === '0px' || /rgba\(0, 0, 0, 0\)|transparent/.test(bar.edge)) && (!barSh.blur || barSh.blur === 'none') && /0px 1px 0px/.test(barSh.sh), JSON.stringify({ ...bar, ...barSh }));
    check('3b the mark is the word "HaTi" in the title serif, no tile', bar.markShown && bar.mark === 'HaTi' && /^"?Source Serif 4/.test(bar.markFace) && /rgba\(0, 0, 0, 0\)|transparent/.test(bar.markBg), JSON.stringify(bar));
    check('3c no theme button, no Blue/Green swatches and no language switch in the bar', !bar.theme && bar.swatches === 0 && !bar.lang, JSON.stringify(bar));
    check('3d the bell\'s count is the ink, not amber', bar.bell === 'rgb(29, 29, 31)', String(bar.bell));

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
    check('5c a filled button is the ink (LEGORA: #1D1D1F)', /^#1D1D1F$/i.test(paper.fill) && (!paper.btnBg || paper.btnBg === 'rgb(29, 29, 31)'), JSON.stringify(paper));
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
    check('7d … and only the map: the paper side in the same wrapper (Home\'s paper, the Contracts place) wears the new look\'s 10px', ex.paperR === '10px', JSON.stringify(ex));
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

    /* ================= 11. THE REST OF THE PLATFORM (21 Oct 2026) ===========
       The owner's review of fourteen more pages found leftovers of the old
       look; "Finish everything". Each is measured where it is drawn. */
    const tok = v => page.evaluate(v => { const p = document.createElement('i'); p.style.color = v; document.body.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c; }, v);
    const NONE = /rgba\(0, 0, 0, 0\)|transparent/;
    /* on Parties: a party is chosen on arrival, its agreements listed with their status in Jambo's panel.
       RE-POINTED 21 Oct 2026 (Part 8, the list head the Legora way): the list's
       count is its lit tab's number (the card's own head and its pill went) */
    const LIT_N = '[data-lh-seat="customers"] [role="tab"][aria-selected="true"] .n';
    await page.evaluate(() => setView('customers'));
    await until(s => !!document.querySelector(s) && !!document.querySelector('#ins-panel .reg-stg'), LIT_N, 10000);
    const ap = await page.evaluate(s => { const n = document.querySelector(s), ns = n && getComputedStyle(n);
      const st = document.querySelector('#ins-panel .reg-stg'), d = st && st.querySelector(':scope > i'), dr = d && d.getBoundingClientRect();
      const pn = document.querySelector('#content .ins-panel.is-jambo');
      /* the Kind tag is drawn only where a list has approvals or requests; its rule is read off a probe of the class */
      const k = document.createElement('span'); k.className = 'ap-kind'; k.textContent = 'Approval'; document.body.appendChild(k);
      const kr = getComputedStyle(k).borderTopLeftRadius; k.remove();
      return { nBg: ns && ns.backgroundColor, nPad: ns && ns.paddingLeft, nPadR: ns && ns.paddingRight, dot: dr ? [Math.round(dr.width), Math.round(dr.height)] : null,
        shadow: pn && getComputedStyle(pn).boxShadow, kind: kr }; }, LIT_N);
    /* a tab's number keeps its 2px from its word (the head card's one rule for a tab count); a bubble would pad both sides */
    check('11a a count beside a list\'s heading is a plain number: no bubble, no padding', !!ap.nBg && NONE.test(ap.nBg) && ap.nPadR === '0px' && parseFloat(ap.nPad) <= 2, JSON.stringify(ap));
    check('11b a status in Jambo\'s panel carries its dot (8 × 8), not only its word', !!ap.dot && ap.dot[0] === 8 && ap.dot[1] === 8, JSON.stringify(ap.dot));
    /* LEGORA: the panel beside a list floats, a white card with the faint lift; a tag has the soft corner */
    check('11c Jambo\'s panel beside a list floats: a card with the faint lift', !!ap.shadow && ap.shadow !== 'none' && /0px 8px 28px/.test(ap.shadow), String(ap.shadow));
    check('11d a tag in a list (Kind) has the soft corner of the new look', !!ap.kind && parseFloat(ap.kind) >= 8, String(ap.kind));
    await page.evaluate(() => { setView('dashboard'); if (window.hbSetFace) hbSetFace('board'); });
    await until(() => !!document.querySelector('#hb-board .hb-card') && !!document.querySelector('.hb-jb-hello .ai-bub'), null, 10000);
    const s2 = await tok('var(--surface-2)');
    const bd = await page.evaluate(() => { const c = document.querySelector('#hb-board .hb-card'), b = document.querySelector('.hb-jb-hello .ai-bub'), p = document.querySelector('#hb-board .hb-pill');
      return { edge: c && getComputedStyle(c).borderTopColor, lift: c && getComputedStyle(c).boxShadow, bub: b && getComputedStyle(b).backgroundColor, pill: p ? getComputedStyle(p).backgroundColor : 'none drawn' }; });
    /* RE-POINTED 23 Oct 2026 (THE LEGORA LOOK, stage 2: cards float with no outline, as drawn): the card's edge
       is clear and it stands off the ground by the faint lift */
    check('11e the Board\'s cards float by their lift with no outline, and Jambo\'s words sit on the warm box every panel uses', NONE.test(bd.edge) && /0px 8px 28px/.test(bd.lift || '') && bd.bub === s2, JSON.stringify(bd) + ' box ' + s2);
    check('11f the Board\'s counts are plain numbers', bd.pill === 'none drawn' || NONE.test(bd.pill), String(bd.pill));
    /* ours, on the paper: three redlines staged the way a person files them */
    const ins = await page.evaluate(async () => { const c = getContract('MK-B2'); if (c._light && window.ensureFull) await ensureFull(c);
      const k = negoClauseList(c).filter(x => String(x.text || '').length > 60)[1];
      if (k) await negoEditClause(c, k.clauseId, '<p>' + String(k.text).replace(/\.\s*$/, '') + ', confirmed in writing.</p>', { side: 'owner', author: 'Admin', why: 'Our standard.' });
      if (window.persist) persist(c); if (window.flushSaves) await flushSaves(); return !!k; });
    await page.evaluate(() => { regPlaceSet({ show: 'list' }); setView('register'); });
    await page.waitForTimeout(400);
    await page.evaluate(() => regOpenContract('MK-B2'));
    await until(() => !!document.querySelector('#pd-glance'), null, 12000);
    await page.evaluate(() => (window.pdRedOpen ? pdRedOpen('MK-B2') : openRedlineWorkbench('MK-B2', { face: true })));
    await until(() => !!document.querySelector('#ig-paper ins.rl-us'), null, 12000);
    const green = await tok('var(--st-green-bg)');
    const us = await page.evaluate(() => { const i = document.querySelector('#ig-paper ins.rl-us'); return i ? getComputedStyle(i).backgroundColor : null; });
    check('11g our new words on the paper sit on the green wash, not the old steel blue', ins && us === green, us + ' (green ' + green + ')');
    /* the other side's page and the public status page */
    const links = await page.evaluate(async () => { const c = getContract('MK-B2'), out = {};
      for (const purpose of ['negotiate', 'status']){ try { const payload = buildSharePayload(c, null, { org: FIRST_PARTY, name: 'Admin' }, { purpose });
        const r = await api('shares', 'POST', { payload, channel: 'link', purpose, durable: true, recipient: { name: 'Erik Lund', email: 'erik@coastretail.example' } });
        out[purpose] = r && (r.token || (r.share && r.share.token)); } catch (e) { out[purpose + 'Err'] = String(e.message || e); } }
      return out; });
    const them = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    if (links.negotiate){
      await them.goto(h.base + '/#share=t:' + links.negotiate, { waitUntil: 'networkidle' });
      await them.waitForFunction(() => !!document.querySelector('.pw-id-main h1'), null, { timeout: 15000 }).catch(() => {});
      const pt = await them.evaluate(() => { const h1 = document.querySelector('.pw-id-main h1'), st = document.querySelector('.pw-id-stat'), d = st && st.querySelector(':scope > i'),
          turn = document.getElementById('pt-turn'), tb = turn && turn.querySelector('.pw-turn'), bd = document.querySelector('.pw-id-badge'), pch = document.querySelector('.ds-pch.is-ours');
        return { face: h1 && getComputedStyle(h1).fontFamily, dot: d ? Math.round(d.getBoundingClientRect().width) : 0, turnBg: tb ? getComputedStyle(tb).backgroundColor : 'none drawn',
          mark: bd && bd.textContent.trim(), pch: pch ? getComputedStyle(pch).backgroundColor + ' ' + getComputedStyle(pch).borderTopLeftRadius : 'none drawn' }; });
      check('11h the other side\'s page: the title in the serif, the status with its dot, whose turn unboxed, the word HaTi for the mark',
        /^"?Source Serif 4/.test(pt.face || '') && pt.dot === 7 && (pt.turnBg === 'none drawn' || NONE.test(pt.turnBg)) && pt.mark === 'HaTi', JSON.stringify(pt));
      check('11i … and the parties on the deal card are soft tags, ours untinted', pt.pch === 'none drawn' || /^(rgba\(0, 0, 0, 0\)|transparent) 10px$/.test(pt.pch), String(pt.pch));
    } else check('11h the other side\'s page could be opened', false, JSON.stringify(links));
    if (links.status){
      const res = await them.goto(h.base + '/deal/' + links.status, { waitUntil: 'load' });
      const html = res ? await res.text() : '';
      const sp = await them.evaluate(() => ({ ground: getComputedStyle(document.body).backgroundColor, band: getComputedStyle(document.body.firstElementChild).backgroundColor,
        caps: [...document.querySelectorAll('*')].filter(e => getComputedStyle(e).textTransform === 'uppercase' && e.textContent.trim()).length }));
      check('11j the public status page wears the one look: the soft grey ground, a white band, no old blue, no capitals',
        sp.ground === 'rgb(245, 245, 247)' && sp.band === 'rgb(255, 255, 255)' && !/#264C9E|#EDF1F2|#EEF2F8|#2A4A86/i.test(html) && sp.caps === 0, JSON.stringify(sp));
    } else check('11j the status page could be opened', false, JSON.stringify(links));
    await them.close();

    /* ================= 12. WHAT THE LEGORA LOOK ADDS (23 Oct 2026) =========
       Every claim off the real page. RED AT THE PARENT: all of them. */
    const GREY = 'rgb(240, 240, 243)', INK = 'rgb(29, 29, 31)';
    const pill = r => parseFloat(r) >= 100;
    await page.evaluate(() => { if (typeof deskGoCounter === 'function') deskGoCounter(); else setView('counter'); });
    await until(() => !!document.querySelector('#cn-page .cn-ask .jb-card'));
    const hm = await page.evaluate(() => { const b = [...document.querySelectorAll('#cn-page .ui-btn')].find(x => !x.classList.contains('ui-btn-primary') && !x.classList.contains('ui-btn-plain') && x.getBoundingClientRect().width);
      const bs = b && getComputedStyle(b), jb = document.querySelector('#cn-page .cn-ask .jb-card'), js = jb && getComputedStyle(jb);
      return { ground: getComputedStyle(document.getElementById('app-shell')).backgroundColor, btn: bs ? { r: bs.borderTopLeftRadius, bg: bs.backgroundColor, edge: bs.borderTopColor } : null,
        jb: js ? { r: js.borderTopLeftRadius, img: js.backgroundImage.slice(0, 240) } : null }; });
    check('12a the page\'s ground is the soft cool grey #F5F5F7', hm.ground === 'rgb(245, 245, 247)', hm.ground);
    check('12b a button is a pill filled in the soft grey, with no edge', !!hm.btn && pill(hm.btn.r) && hm.btn.bg === GREY && /rgba\(0, 0, 0, 0\)|transparent/.test(hm.btn.edge), JSON.stringify(hm.btn));
    check('12c Jambo\'s box is a pill wearing the one coloured edge (teal → violet → coral)', !!hm.jb && pill(hm.jb.r) && /linear-gradient/.test(hm.jb.img) && /10, 124, 107/.test(hm.jb.img), JSON.stringify(hm.jb));
    await page.evaluate(() => { regPlaceSet({ show: 'list' }); setView('register'); });
    await until(() => !!document.querySelector('#reg-tbody tr[data-row]'));
    const ls = await page.evaluate(() => { const t = document.querySelector('.reg-vtab.on'), ts = t && getComputedStyle(t);
      const sg = document.querySelector('.reg-seg.ct-seg'), ss = sg && getComputedStyle(sg), on = sg && sg.querySelector('button.on, button[aria-pressed="true"]'), os = on && getComputedStyle(on);
      return { tab: ts ? { bg: ts.backgroundColor, bb: ts.borderBottomWidth, r: ts.borderTopLeftRadius } : null, seg: ss ? { bg: ss.backgroundColor, r: ss.borderTopLeftRadius, b: ss.borderTopWidth } : null, on: os ? { bg: os.backgroundColor, r: os.borderTopLeftRadius } : null }; });
    check('12d a list\'s chosen tab is a filled grey pill, never an underline', !!ls.tab && ls.tab.bg === GREY && ls.tab.bb === '0px' && pill(ls.tab.r), JSON.stringify(ls.tab));
    check('12e a switch (List | Wall) is a grey pill holding pills, the chosen one the ink', !!ls.seg && ls.seg.bg === GREY && pill(ls.seg.r) && ls.seg.b === '0px' && !!ls.on && ls.on.bg === INK && pill(ls.on.r), JSON.stringify(ls));
    await page.evaluate(() => regOpenContract('MK-B2'));
    await until(() => !!document.querySelector('#ig-paper .doc-surface') && !!document.querySelector('#ig-dock .pd-tab.on'), null, 12000);
    const fl = await page.evaluate(() => { const g = id => { const e = document.getElementById(id); if (!e) return null; const c = getComputedStyle(e);
        return { r: c.borderTopLeftRadius, bg: c.backgroundColor, sh: c.boxShadow, m: c.marginTop + ' ' + c.marginRight + ' ' + c.marginBottom }; };
      const t = document.querySelector('#ig-dock .pd-tab.on'), tc = t && getComputedStyle(t), ta = t && getComputedStyle(t, '::after');
      /* the sheet = every white page-sized box the wording sits on, whichever paper class draws it (the plain
         paper's .pg-sheet, the redline paper's own) — each keeps a square corner */
      const sheets = [...document.querySelectorAll('#ig-paper-scroll *')].filter(e => { const r = e.getBoundingClientRect(), c = getComputedStyle(e);
        return r.width >= 500 && r.height >= 300 && c.backgroundColor === 'rgb(255, 255, 255)'; });
      const shr = sheets.length ? [...new Set(sheets.map(e => getComputedStyle(e).borderTopLeftRadius))].join(',') : null;
      const diag = sheets.map(e => e.tagName + '.' + String(e.className).slice(0, 30)).join(' | ');
      return { dock: g('ig-dock'), col: g('hb-col'), paper: g('ig-paper'), tab: tc ? { bg: tc.backgroundColor, r: tc.borderTopLeftRadius, h: Math.round(t.getBoundingClientRect().height), after: ta.content } : null, sheetR: shr, diag }; });
    check('12f beside a paper Jambo\'s panel floats: an 8px margin, 20px corners, the faint lift, white', !!fl.dock && fl.dock.m === '8px 8px 8px' && fl.dock.r === '20px' && /0px 8px 28px/.test(fl.dock.sh) && fl.dock.bg === 'rgb(255, 255, 255)', JSON.stringify(fl.dock));
    check('12g … and so does the paper\'s half: a white card, its canvas inset with 16px corners', !!fl.col && fl.col.r === '20px' && fl.col.bg === 'rgb(255, 255, 255)' && !!fl.paper && fl.paper.r === '16px', JSON.stringify({ col: fl.col, paper: fl.paper }));
    check('12h the panel\'s chosen tab is a slim filled pill (no underline mark)', !!fl.tab && fl.tab.bg === GREY && pill(fl.tab.r) && fl.tab.h <= 32 && (fl.tab.after === 'none' || fl.tab.after === 'normal'), JSON.stringify(fl.tab));
    check('12i the paper itself keeps its square corners — it reads as a document, not a card', fl.sheetR === '0px', String(fl.sheetR) + ' ' + fl.diag);
    await page.evaluate(() => { setView('dashboard'); if (window.hbSetFace) hbSetFace('explorer'); });
    await until(() => !!document.querySelector('#ig-page.hb-dark'), null, 10000);
    const exd = await page.evaluate(() => { const d = document.getElementById('ig-dock'), c = d && getComputedStyle(d); return c ? { m: c.marginTop, r: c.borderTopLeftRadius } : null; });
    check('12j Explorer stays as it was: its panel does not float (owner: "stay dark")', !!exd && exd.m === '0px' && exd.r === '0px', JSON.stringify(exd));
    await page.evaluate(() => { if (window.hbSetFace) hbSetFace('board'); });

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
