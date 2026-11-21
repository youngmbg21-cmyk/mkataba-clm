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
    /* the bell's count is painted once the counts land (a wait asks for the state, bounded) */
    await until(() => { const d = document.getElementById('hdr-notify-dot'); return !!d && !d.hidden; });
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
    /* RE-PINNED (owner picked "The SAP way", 24 Oct 2026: "the page is too white"): the bar is a solid deep green, no
       hairline, no filter (one-window-bar-cards-verify B1 measures its words) */
    /* RE-POINTED 27 Oct 2026 (THE BAR IN BLACK, owner: "Black it is"): its near-black, the sheen over it */
    check('3a the bar is the near-black, no hairline border, no filter', bar.bg === 'rgb(17, 17, 19)' && (bar.edgeW === '0px' || /rgba\(0, 0, 0, 0\)|transparent/.test(bar.edge)) && (!barSh.blur || barSh.blur === 'none'), JSON.stringify({ ...bar, ...barSh }));
    check('3b the mark is the word "HaTi" in the title serif, no tile', bar.markShown && bar.mark === 'HaTi' && /^"?Source Serif 4/.test(bar.markFace) && /rgba\(0, 0, 0, 0\)|transparent/.test(bar.markBg), JSON.stringify(bar));
    check('3c no theme button, no Blue/Green swatches and no language switch in the bar', !bar.theme && bar.swatches === 0 && !bar.lang, JSON.stringify(bar));
    /* RE-POINTED 9 Nov 2026 (owner picked "The SAP Way", drawn with a red count): the one panel button's count is --st-ruby-dot */
    check('3d the panel button\'s count is the red count drawn, not amber', bar.bell === 'rgb(194, 69, 59)', String(bar.bell));

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
    /* 4a, 4d RETIRED (owner, 10 Nov 2026: "Home page should be removed / deleted"): Home's question and its chips went with
       Home; what stays is asked of every page: no bird, no hint line, no perch */
    check('4b no bird anywhere on a computer', home.birds === 0, JSON.stringify(home));
    check('4c no hint line under the box, no perch', home.hints === 0 && home.perch === 0, JSON.stringify(home));
    for (const [w, hh] of SCREENS){ await page.setViewportSize({ width: w, height: hh }); await page.waitForTimeout(400); await page.screenshot({ path: path.join(OUT, `home-${w}x${hh}.png`) }); }
    await page.setViewportSize({ width: 1440, height: 780 });

    /* ================= 6. THE CONTRACTS LIST ================================ */
    await page.evaluate(() => { regPlaceSet({ show: 'list' }); setView('register'); });
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): Contracts opens on its Folders; the head's List pill shows the list */
    if (await until(() => { const b = document.querySelector('[data-ctf-show="list"]'); return !!b && b.getClientRects().length > 0 && !document.querySelector('#reg-tbody tr[data-row]'); }, null, 4000)) await page.click('[data-ctf-show="list"]');
    /* RE-POINTED 27 Oct 2026 (THE LIST LANGUAGE, owner: "keep contracts … as designed"): the stage is a
       word in its own tone in the grey line under the agreement, and a mark leads the row; a party's
       initials (where a list still draws them) wear their tone's wash, not Chambers' outline */
    await until(() => !!document.querySelector('#reg-tbody tr[data-row] .reg-standing'));
    const list = await page.evaluate(() => {
      /* RE-POINTED 16 Nov 2026 (#762): the new look's row leads with THE SAP WAY MARK (.ls-mk, f997) and says the stage as
         its word in its tone in its own column (.reg-standing) */
      const st = document.querySelector('#reg-tbody .reg-standing'), mk = document.querySelector('#reg-tbody .reg-id .ls-mk'), t = document.querySelector('.ct-h');
      const probe = document.createElement('span'); probe.className = 'reg-av av-1'; document.body.appendChild(probe);
      const a = getComputedStyle(probe), avBg = a.backgroundColor, avEdge = a.borderTopColor; probe.remove();
      const s = st && getComputedStyle(st), ts = t && getComputedStyle(t);
      /* the new look's stage is the cell's own words: its "no pill" is no wash on the cell nor on anything inside it */
      const stPill = !!st && [...st.querySelectorAll('*')].some(e => !/rgba\(0, 0, 0, 0\)|transparent/.test(getComputedStyle(e).backgroundColor));
      return { stBg: s && s.backgroundColor, stPad: stPill ? 'pill' : '0px', mark: !!(mk && mk.querySelector('svg')), avBg, avEdge,
        title: ts && ts.fontFamily, titleW: ts && ts.fontWeight };
    });
    check('6a a stage is its word in its tone, in the grey line: no wash behind it, no pill padding; a mark leads the row', list.mark && /rgba\(0, 0, 0, 0\)|transparent/.test(list.stBg) && list.stPad === '0px', JSON.stringify(list));
    check('6b a party\'s initials wear their tone\'s wash, no outline', !/rgba\(0, 0, 0, 0\)|transparent/.test(list.avBg) && /rgba\(0, 0, 0, 0\)|transparent/.test(list.avEdge), JSON.stringify(list));
    /* RE-POINTED 16 Nov 2026 (#762): the new look's page titles are Geist (f377), the furniture's face; the serif is the paper's */
    /* RE-POINTED 19 Nov 2026 (the Contracts list as drawn, owner's "the new design for contracts lists page", the same
       spacing as Parties): Contracts' title is the SERIF at 26px, as Parties' own title — the other pages keep Geist */
    check('6c Contracts\' page title is the serif, as Parties\' (19 Nov 2026)', /Source Serif/.test(list.title || ''), JSON.stringify(list));

    /* ================= 5. BESIDE A PAPER ==================================== */
    await page.evaluate(() => regOpenContract('MK-B2'));
    /* RE-POINTED 28 Oct 2026 ("Door above the box"): his name heads the panel only in the conversation, so it is turned to */
    await until(() => !!document.querySelector('#ig-paper .doc-surface') && !!document.getElementById('igd-input'), null, 12000);
    await page.evaluate(() => { if (typeof pdTalkReopen === 'function') pdTalkReopen(); });
    await until(() => !!document.querySelector('#ig-dock .pd-tab-talk'), null, 6000);
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
    check('5b his name over the conversation beside the paper carries the ✦ mark, not the bird', paper.mark && !paper.tabBird, JSON.stringify(paper));
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
    /* RE-POINTED 19 Nov 2026 (Settings, door to door, f1091): the language row is in the You area */
    await page.evaluate(() => { setView('team'); if (typeof window.sddGo === 'function') window.sddGo('you'); });
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
    /* RE-POINTED 16 Nov 2026 (#762): the new look's Parties head is ONE HEAD (.cun-head): its title and the count beside it
       as a plain fact (.ctf-hf, "3 counterparties"); it draws no tabs */
    /* RE-POINTED (P-25, owner's pick 20 Nov 2026: Parties the Legora + Stripe way): the facts beside the title are gone (the
       chips say it); the count is the All chip's number (.apn-tab.is-chip > span) — still a plain number, no bubble */
    const LIT_N = '.cun-page .apn-tab.is-chip[data-cun-tab="all"] > span';
    await page.evaluate(() => setView('customers'));
    await until(s => !!document.querySelector(s) && !!document.querySelector('#ins-panel'), LIT_N, 10000);
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
    /* 11b is kept as written: QUESTION Q-D3-3 (the new look says a status as its word in its tone with THE SAP WAY MARK, no dot) */
    /* RE-POINTED 19 Nov 2026 (the Parties round, owner's drawings): Parties' panel lists a party's agreements as the five
       parts' rows — a file mark, the agreement, its stage in words ("Executed · ends …") — so the status dot is read
       where a stage is drawn as a cell, the Parties LIST's Standing column */
    /* RETIRED 19 Nov 2026 (owner's pick "the SAP way, revised"): 11b "a status on Parties carries its dot" — Parties has no
       Standing column any more (one word cannot say many contracts' stages); a stage's dot is checked on Contracts' list */
    /* LEGORA: the panel beside a list floats, a white card with the faint lift; a tag has the soft corner */
    /* RETIRED 16 Nov 2026 (#762): 11c "Jambo's panel beside a list floats: a card with the faint lift" — the Legora look's floating panel;
       in the new look the panel stands edge to edge beside the white sheet (CLAUDE.md: a panel not edge to edge is the old look) */
    check('11d a tag in a list (Kind) has the soft corner of the new look', !!ap.kind && parseFloat(ap.kind) >= 8, String(ap.kind));
    await page.evaluate(() => { setView('dashboard'); if (window.hbSetFace) hbSetFace('board'); });
    /* RE-POINTED 26 Oct 2026 (owner: "Build Jambo's Overview tab The Legora Way": nothing boxed): his words beside the page are the Overview's head and lines (.jov-head, .jov-v), and his chips its offers (.jov-lnk.is-ask) */
    await until(() => !!document.querySelector('#hb-board .hb-card') && !!document.querySelector('.hb-jb-hello .jov'), null, 10000);
    const s2 = 'rgba(0, 0, 0, 0)';
    const bd = await page.evaluate(() => { const c = document.querySelector('#hb-board .hb-card'), b = document.querySelector('.hb-jb-hello .jov'), p = document.querySelector('#hb-board .hb-pill');
      return { edge: c && getComputedStyle(c).borderTopColor, lift: c && getComputedStyle(c).boxShadow, bub: b && getComputedStyle(b).backgroundColor, pill: p ? getComputedStyle(p).backgroundColor : 'none drawn' }; });
    /* RE-POINTED 23 Oct 2026 (THE LEGORA LOOK, stage 2: cards float with no outline, as drawn): the card's edge
       is clear and it stands off the ground by the faint lift */
    /* RE-POINTED 16 Nov 2026 (#762): the new look's lift is its own token (not the Legora look's 0 8px 28px): the card still
       floats by a lift and has no outline */
    check('11e the Board\'s cards float by their lift with no outline, and Jambo\'s Overview beside them is not boxed', NONE.test(bd.edge) && !!bd.lift && bd.lift !== 'none' && bd.bub === s2, JSON.stringify(bd) + ' box ' + s2);
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
      /* RE-POINTED 17 Nov 2026 (the new look is the only look, #762; their page as drawn in round 8, owner's ruling round 2
         answer 5): the identity line (.pw-id-main: the serif title, the status pill with its dot, whose turn) is not drawn on
         their page — the black bar stands there, the word HaTi for the mark (.pol-mark) and the contract named beside it
         (.pol-what). Asked: both painted, the mark the word HaTi, the bar naming this contract, and the old identity line
         not left half-drawn (hidden whole). RETIRED with it (round 2 answer 5): the serif title and the status pill's dot
         on that line — their page's status lives in its Where we are tab. */
      const bar = await them.evaluate(() => { const vis = e => !!e && e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().height > 0;
        const m = document.querySelector('.pol-bar .pol-mark'), w = document.querySelector('.pol-bar .pol-what'), id = document.querySelector('.pw-id-main');
        return { mark: vis(m) ? m.textContent.trim() : null, what: vis(w) ? w.textContent.replace(/\s+/g, ' ').trim() : null, idShown: vis(id) }; });
      const nm = await page.evaluate(() => (getContract('MK-B2') || {}).name || '');
      check('11h the other side\'s page: the black bar\'s mark is the word HaTi and it names the contract; no half-drawn identity line',
        bar.mark === 'HaTi' && !!nm && (bar.what || '').includes(nm) && !bar.idShown && (pt.turnBg === 'none drawn' || NONE.test(pt.turnBg)), JSON.stringify({ bar, nm, turnBg: pt.turnBg }));
      check('11i … and the parties on the deal card are soft tags, ours untinted', pt.pch === 'none drawn' || /^(rgba\(0, 0, 0, 0\)|transparent) 10px$/.test(pt.pch), String(pt.pch));
    } else check('11h the other side\'s page could be opened', false, JSON.stringify(links));
    if (links.status){
      const res = await them.goto(h.base + '/deal/' + links.status, { waitUntil: 'load' });
      const html = res ? await res.text() : '';
      const sp = await them.evaluate(() => ({ ground: getComputedStyle(document.body).backgroundColor, band: getComputedStyle(document.body.firstElementChild).backgroundColor,
        caps: [...document.querySelectorAll('*')].filter(e => getComputedStyle(e).textTransform === 'uppercase' && e.textContent.trim()).length }));
      /* RE-POINTED 16 Nov 2026 (#762): the outside look (outsideLookOn, both hosts) draws the status page on the new look's
         white page, its parts unboxed (dealPageHtml {out}); the Legora look's grey ground and white band are retired */
      check('11j the public status page wears the one look: the white page, no old blue, no capitals',
        sp.ground === 'rgb(255, 255, 255)' && !/#264C9E|#EDF1F2|#EEF2F8|#2A4A86/i.test(html) && sp.caps === 0, JSON.stringify(sp));
    } else check('11j the status page could be opened', false, JSON.stringify(links));
    await them.close();

    /* ================= 12. WHAT THE LEGORA LOOK ADDS (23 Oct 2026) =========
       Every claim off the real page. RED AT THE PARENT: all of them. */
    const GREY = 'rgb(240, 240, 243)', INK = 'rgb(29, 29, 31)';
    const pill = r => parseFloat(r) >= 100;
    /* RE-POINTED (owner, 10 Nov 2026: Home deleted): measured on the Board, where you land — its Needs you buttons and Jambo's box */
    await page.evaluate(() => { if (typeof deskGoCounter === 'function') deskGoCounter(); else setView('dashboard'); });
    await until(() => !!document.querySelector('#ig-dock .jb-card') && !!document.querySelector('#hm-agents .ui-btn'));
    const hm = await page.evaluate(() => { const b = [...document.querySelectorAll('#hm-agents .ui-btn')].find(x => !x.classList.contains('ui-btn-primary') && !x.classList.contains('ui-btn-plain') && x.getBoundingClientRect().width);
      const bs = b && getComputedStyle(b), jb = document.querySelector('#ig-dock .jb-card'), js = jb && getComputedStyle(jb);
      return { ground: getComputedStyle(document.getElementById('app-shell')).backgroundColor, btn: bs ? { r: bs.borderTopLeftRadius, bg: bs.backgroundColor, edge: bs.borderTopColor } : null,
        jb: js ? { r: js.borderTopLeftRadius, img: js.backgroundImage.slice(0, 240), edge: js.borderTopColor } : null }; });
    check('12a the page\'s ground is the soft cool grey #F5F5F7', hm.ground === 'rgb(245, 245, 247)', hm.ground);
    check('12b a button is a pill filled in the soft grey, with no edge', !!hm.btn && pill(hm.btn.r) && hm.btn.bg === GREY && /rgba\(0, 0, 0, 0\)|transparent/.test(hm.btn.edge), JSON.stringify(hm.btn));
    /* RE-POINTED 24 Oct 2026 (Round 2): the ring ended in red and read as an error; one calm green edge */
    check('12c Jambo\'s box is a pill wearing the one coloured edge, plain green', !!hm.jb && pill(hm.jb.r) && hm.jb.img === 'none' && hm.jb.edge === 'rgb(8, 115, 99)', JSON.stringify(hm.jb));
    await page.evaluate(() => { regPlaceSet({ show: 'list' }); setView('register'); });
    /* RE-POINTED 16 Nov 2026 (#762): Contracts opens on its Folders; the List pill shows the list */
    if (await until(() => { const b = document.querySelector('[data-ctf-show="list"]'); return !!b && b.getClientRects().length > 0 && !document.querySelector('#reg-tbody tr[data-row]'); }, null, 4000)) await page.click('[data-ctf-show="list"]');
    await until(() => !!document.querySelector('#reg-tbody tr[data-row]'));
    const ls = await page.evaluate(() => { const t = document.querySelector('.reg-vtab.on'), ts = t && getComputedStyle(t);
      const sg = document.querySelector('.reg-seg.ct-seg'), ss = sg && getComputedStyle(sg), on = sg && sg.querySelector('button.on, button[aria-pressed="true"]'), os = on && getComputedStyle(on);
      return { tab: ts ? { bg: ts.backgroundColor, bb: ts.borderBottomWidth, r: ts.borderTopLeftRadius } : null, seg: ss ? { bg: ss.backgroundColor, r: ss.borderTopLeftRadius, b: ss.borderTopWidth } : null, on: os ? { bg: os.backgroundColor, r: os.borderTopLeftRadius } : null }; });
    /* RE-POINTED 19 Nov 2026 (the Contracts list as drawn, owner's "the new design for contracts lists page", the same
       spacing as Parties): Contracts' chosen tab is UNDERLINED in the ink green, on no fill — the other lists keep their pills */
    check('12d Contracts\' chosen tab is an underline on no fill (19 Nov 2026)', !!ls.tab && NONE.test(ls.tab.bg) && ls.tab.bb === '2px' && ls.tab.r === '0px', JSON.stringify(ls.tab));
    /* RE-POINTED 16 Nov 2026 (#762): the new look's head draws List · Wall as separate grey pills (no holding pill), the
       chosen one in the strong weight (index.html "the list's head as drawn") */
    const sw = await page.evaluate(() => [...document.querySelectorAll('#ct-place .ct-head .ct-seg button')].map(b => { const c = getComputedStyle(b);
      return { on: b.getAttribute('aria-pressed') === 'true', bg: c.backgroundColor, r: c.borderTopLeftRadius, w: Number(c.fontWeight), shown: b.getClientRects().length > 0 }; }));
    const swOn = sw.find(b => b.on), swOff = sw.find(b => !b.on);
    check('12e a switch (List | Wall) is grey pills, the chosen one in the strong weight', !!ls.seg && NONE.test(ls.seg.bg) && sw.length === 2 && sw.every(b => b.shown && b.bg === GREY && pill(b.r)) && !!swOn && !!swOff && swOn.w > swOff.w, JSON.stringify({ seg: ls.seg, sw }));
    void INK;
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
    /* RETIRED 16 Nov 2026 (#762): 12f "beside a paper Jambo's panel floats: an 8px margin, 10px corners, the faint lift" and
       12g "the paper's half a white card at the 10px corner" — the Legora look's floating halves; the new look sets the panel
       edge to edge and the paper on its desk (ONE SHEET; CLAUDE.md: "a panel that is not edge to edge is the old look") */
    check('12h the panel\'s chosen tab is a slim filled pill (no underline mark)', !!fl.tab && fl.tab.bg === GREY && pill(fl.tab.r) && fl.tab.h <= 32 && (fl.tab.after === 'none' || fl.tab.after === 'normal'), JSON.stringify(fl.tab));
    check('12i the paper itself keeps its square corners — it reads as a document, not a card', fl.sheetR === '0px', String(fl.sheetR) + ' ' + fl.diag);
    await page.evaluate(() => { setView('dashboard'); if (window.hbSetFace) hbSetFace('explorer'); });
    await until(() => !!document.querySelector('#ig-page.hb-dark'), null, 10000);
    const exd = await page.evaluate(() => { const d = document.getElementById('ig-dock'), c = d && getComputedStyle(d); return c ? { m: c.marginTop, r: c.borderTopLeftRadius } : null; });
    check('12j Explorer stays as it was: its panel does not float (owner: "stay dark")', !!exd && exd.m === '0px' && exd.r === '0px', JSON.stringify(exd));
    /* 24 Oct 2026 (owner): your words to Jambo wear his answers' rounding, in Home's panel and the chat window */
    const bubs = await page.evaluate(() => { const u = { role: 'user', text: 'What is late?' }, a = { role: 'assistant', text: 'Two are late.' }, H = [u, a];
      const r = e => e ? getComputedStyle(e).borderBottomRightRadius + ' ' + getComputedStyle(e).borderTopLeftRadius : null, out = {};
      const put = (sel, html) => { const d = document.createElement('div'); d.innerHTML = html; (document.querySelector(sel) || document.body).appendChild(d); return d; };
      if (typeof igMsgHTML === 'function'){ const d = put('#ig-dock', igMsgHTML(u, 0, H) + igMsgHTML(a, 1, H)); out.ig = [r(d.querySelector('.ig-bub-me')), r(d.querySelector('.jl-bub'))]; d.remove(); }
      if (typeof aiMsgHtml === 'function'){ const d = put('#ai-feed', aiMsgHtml(u, 0) + aiMsgHtml(a, 1)); const b = d.querySelectorAll('.ai-bub'); out.ai = [r(b[0]), r(b[1])]; d.remove(); }
      return out; });
    check('12k your words to Jambo are rounded as his answers are, in Home\'s panel and the chat window', !!bubs.ig && !!bubs.ai && [bubs.ig, bubs.ai].every(p => p[0] && p[0] === p[1] && !/^0px/.test(p[0])), JSON.stringify(bubs));
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
