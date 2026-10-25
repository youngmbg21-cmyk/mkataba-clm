/* JAMBO, THE SLIDING PILL, THE WINDOW THAT MOVES, AND A WAIT THAT MOVES
   (owner, 11 Oct 2026: "Build all three together" — Copilot renamed Jambo with
   his face in the chats; Home's faces as one sliding pill in the order
   Board · Document · Calendar · Explorer (the Breakdown face was deleted by the
   owner, 13 Oct 2026), all one size; the Jambo
   window dragged and resized up to today's expanded size, stepping aside where
   Jambo is already on the page; and "when something is loading, there should
   be some type of movement on screen").

   Asked where the reader looks: the head's buttons in both languages, the pill
   under the pressed face, the door on Home going to Home's own panel, the
   window's limits measured, its stepping aside and coming back, Jambo's face
   beside his words, and Jambo's read of a contract's Clauses wearing a turning
   ring while it waits.
   RE-POINTED 20 Oct 2026 (Chambers): on a computer his face is the ✦ mark
   (JAMBO_MARK_PATH) in the window's head, beside his words and on the top
   bar's door; the bird is the phone's.
   RE-POINTED 21 Oct 2026 (owner: Jambo slides in as a side panel, the ✦ drops an
   ask bar): the window that moved and resized is gone (4, 5, 6; 7 retired with
   the dock button) — test/chromium/jambo-slides-in-verify.js carries the rest. */
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'jambo-pill-and-window');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let pass = 0, fail = 0;
const ok = (name, good, detail) => { good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const until = (page, fn, arg, ms = 8000) => page.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);
  try {
    const page = await (await browser.newContext({ viewport: { width: 1500, height: 900 } })).newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    /* signing in lands on the Counter since 17 Oct 2026 (Round 1); Home is opened */
    await until(page, () => typeof hbOpenHome === 'function' && !document.body.classList.contains('pre-auth'), null, 15000);
    await page.evaluate(() => hbOpenHome());
    await until(page, () => !!document.getElementById('hb-head'), null, 15000);

    /* ---- 1 the faces are Recent's pages (RE-POINTED 18 Oct 2026: the owner picked
       "The SAP way"; no pill and no head row on a computer, the bar names the face) ---- */
    const head = await page.evaluate(() => ({ pill: !!document.querySelector('#hb-head .hb-faces'), headShown: document.getElementById('hb-head').getBoundingClientRect().height > 0,
      bar: (document.getElementById('dk-page') || {}).textContent.trim(), want: deskTabLabel(deskKeyNow()),
      faces: HB_FACES.slice(), en: ['board', 'calendar', 'explorer'].map(f => deskTabLabel('home:' + f)) }));
    ok('1a no pill and no head row: the bar names the face', !head.pill && !head.headShown && !!head.want && head.bar === head.want, JSON.stringify(head));
    ok('1b the faces are Board · Document · Calendar · Explorer (no Breakdown)', head.faces.join(',') === 'board,paper,calendar,explorer', head.faces.join(','));
    ok('1c each face\'s tab is named in English', head.en.join(',') === 'Board,Calendar,Explorer', head.en.join(','));
    await page.evaluate(() => { if (typeof langSet === 'function') langSet('sv'); if (typeof applyLanguage === 'function') applyLanguage(); });
    const sv = await page.evaluate(() => ['board', 'calendar', 'explorer'].map(f => deskTabLabel('home:' + f)));
    ok('1e and in Swedish', sv.join(',') === 'Tavla,Kalender,Utforskaren', sv.join(','));
    await page.evaluate(() => { if (typeof langSet === 'function') langSet('en'); if (typeof applyLanguage === 'function') applyLanguage(); if (typeof setView === 'function') setView('dashboard'); });
    await until(page, () => !!document.getElementById('hb-head'), null, 5000);

    /* ---- 2 the name ---- */
    const door = await page.evaluate(() => (document.getElementById('cmd-ai') || {}).title || '');
    ok('2a the top bar door says Ask Jambo', /Ask Jambo/.test(door), door);

    /* ---- 3 Jambo's read of a contract's Clauses: the wait moves ---- */
    await page.route('**/api/ai/breakdown', () => {});   // never answers: the wait stays on screen
    const picked = await page.evaluate(() => { if (window.state) state.aiConfigured = true;
      const c = (state.contracts || []).find(x => x && x.id); if (!c) return false;
      if (typeof hbSetFace === 'function') hbSetFace('paper'); return pdOpenOnHome(c.id, 'doc'); });
    const ring = await until(page, () => { const s = document.querySelector('#pd-thread .stk-busy .ob-spin');
      return !!(s && getComputedStyle(s).animationName === 'obSpin'); }, null, 8000);
    ok('3a "Jambo is reading…" carries a turning ring while it waits', picked && ring, picked ? '' : 'no contract to open');
    await page.screenshot({ path: path.join(OUT, '3-clauses-wait.png') });
    await page.unroute('**/api/ai/breakdown');

    /* ---- 4 on Home, the bar's door ----
       RE-POINTED AGAIN 21 Oct 2026 (owner picked "The old chat window": "when i type in it, it
       just jumps to the jambo in the side panel. It is not the old chatbot i had"): the ✦ opens
       the floating chat window on every page, Home included, the cursor in its box; no one-line
       bar; Home's own Jambo stays where it is */
    await page.evaluate(f => { if (state.view === 'dashboard' && document.getElementById('hb-head')) hbSetFace(f); else { hbS().face = f; hbSave(); setView('dashboard'); } }, 'board');
    await page.click('#cmd-ai');
    const home = await page.evaluate(() => { const p = document.getElementById('ai-panel');
      return { open: p.classList.contains('open'), floating: p.classList.contains('floating'), aside: p.classList.contains('ai-stepaside'), bar: !!document.getElementById('jb-bar'), focus: document.activeElement && document.activeElement.id }; });
    ok('4a on Home the ✦ opens the floating chat window, the cursor in its box (no ask bar)', home.open && home.floating && !home.aside && !home.bar && home.focus === 'ai-input', JSON.stringify(home));
    await page.keyboard.press('Escape');

    /* ---- 5 the window is a side panel ----
       RE-POINTED 21 Oct 2026 (owner: "let jambo slide in so that it looks like a jambo side panel
       not like the attached autonomous chatbot box"): REVERSES the window you could move and resize
       (11 Oct 2026). On a page with no Jambo of its own — the Brain — it slides in at the right edge
       under the top bar, 384 wide (THE BRIEF), and stays there: no drag, no resize, no dock button */
    await page.evaluate(() => setView('brain'));
    await page.evaluate(() => openAI());
    await until(page, () => document.getElementById('ai-panel').classList.contains('open'));
    await page.waitForTimeout(450);
    const first = await page.evaluate(() => { const p = document.getElementById('ai-panel'), r = p.getBoundingClientRect();
      const mark = p.querySelector('header .ai-head-tile svg path'), name = p.querySelector('header .ai-head-name');
      return { cls: p.className, x: Math.round(r.right), w: Math.round(r.width), top: Math.round(r.top), face: !!(mark && mark.getAttribute('d') === window.JAMBO_MARK_PATH), bird: !!p.querySelector('header img.jambo-face'),
        title: name ? name.textContent.trim() : '' }; });
    ok('5a it opens as the side panel on the right edge, under the top bar, 384 wide', /is-side/.test(first.cls) && !/floating/.test(first.cls) && first.x === 1500 && first.w === 384 && first.top === 48, JSON.stringify(first));
    ok('5b it is called Jambo and shows his ✦ mark (not the bird)', first.title === 'Jambo' && first.face && !first.bird, JSON.stringify({ title: first.title, face: first.face, bird: first.bird }));
    const hb = await (await page.$('#ai-panel > header')).boundingBox();
    await page.mouse.move(hb.x + 140, hb.y + 20); await page.mouse.down(); await page.mouse.move(hb.x - 400, hb.y + 100, { steps: 8 }); await page.mouse.up();
    let r = await (await page.$('#ai-panel')).boundingBox();
    ok('5c dragging the head moves nothing: it is a panel at the edge, not a window', Math.round(r.x + r.width) === 1500 && Math.round(r.width) === 384 && Math.round(r.y) === 48, `${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}`);
    /* RE-POINTED 21 Oct 2026 ("The old chat window"): the ✦'s window carries the handles and the
       dock button again (the same #ai-panel), so the side panel asks that NONE IS DRAWN in it */
    const handles = await page.evaluate(() => ({ rz: [...document.querySelectorAll('#ai-panel [data-ai-rz]')].filter(e => e.getClientRects().length).length,
      dock: (() => { const d = document.getElementById('ai-dock-home'); return !!(d && d.getClientRects().length); })() }));
    ok('5d the side panel draws no resize handles and no dock button', !handles.rz && !handles.dock, JSON.stringify(handles));
    await page.screenshot({ path: path.join(OUT, '5-side-panel.png') });

    /* ---- 6 it steps aside where Jambo is on the page, and comes back ---- */
    const before = { x: Math.round(r.x), y: Math.round(r.y) };
    await page.evaluate(() => setView('dashboard'));
    const aside = await until(page, () => getComputedStyle(document.getElementById('ai-panel')).visibility === 'hidden', null, 4000);
    ok('6a on Home it steps aside', aside);
    await page.evaluate(() => setView('brain'));
    const back = await until(page, () => getComputedStyle(document.getElementById('ai-panel')).visibility === 'visible', null, 4000);
    r = await (await page.$('#ai-panel')).boundingBox();
    ok('6b leaving Home, it comes back where it was', back && Math.round(r.x) === before.x && Math.round(r.y) === before.y, `${Math.round(r.x)},${Math.round(r.y)}`);

    /* ---- 8 his face in the chat (RE-POINTED 20 Oct 2026, Chambers: the ✦ mark on a computer) ---- */
    const feedFace = await page.evaluate(() => { const f = document.querySelector('#ai-feed .jambo-face'); const d = f && f.querySelector('path');
      return { mark: !!(f && f.tagName.toLowerCase() === 'svg' && d && d.getAttribute('d') === window.JAMBO_MARK_PATH), bird: !!document.querySelector('#ai-feed img.jambo-face') }; });
    ok('8a his ✦ mark sits beside his words in the chat (not the bird)', feedFace.mark && !feedFace.bird, JSON.stringify(feedFace));

    /* ---- 11 his mark on his own doors, "Hi" in English, no ask box on the Breakdown (owner, 12 Oct 2026;
       RE-POINTED 20 Oct 2026, Chambers: the top bar door keeps the ✦ mark on a computer — the bird is the phone's) ---- */
    const doors = await page.evaluate(() => ({ bar: !!document.querySelector('#cmd-ai img.jambo-face'),
      barMark: (() => { const d = document.querySelector('#cmd-ai svg path'); return !!(d && d.getAttribute('d') === window.JAMBO_MARK_PATH); })(),
      oldSpark: !!document.querySelector('#cmd-ai use[href="#i-spark"]'),
      greet: (typeof i18t === 'function' ? i18t('ai_welcome') : '').slice(0, 3), note: (typeof i18t === 'function' ? i18t('int_notebook_welcome') : '').slice(0, 3) }));
    ok('11a the top bar door shows Jambo\'s ✦ mark on a computer, not the bird and not the old sparkle', doors.barMark && !doors.bar && !doors.oldSpark, JSON.stringify(doors));
    ok('11b the greeting says Hi', doors.greet === 'Hi!' && doors.note === 'Hi!', JSON.stringify(doors));
    await page.evaluate(() => setView('dashboard'));
    await until(page, () => !!document.querySelector('#ig-dock [data-pd-tab="copilot"]'), null, 6000);
    const tab = await page.evaluate(() => { const t = document.querySelector('#ig-dock [data-pd-tab="copilot"]'); return t ? { face: !!t.querySelector('.jambo-face, .jambo-mark'), word: (t.querySelector('.pd-tab-w') || {}).textContent } : null; });
    /* RE-POINTED 19 Oct 2026 — JAMBO AS A TAB YOU FLIP TO (owner: the panel's
       first tab is "Overview"; "Jambo" names only the conversation it flips to) */
    /* RE-POINTED 19 Oct 2026 (owner: his face belongs on "its one tab that says Jambo"): Overview wears ▦.
       RE-POINTED 20 Oct 2026 (Chambers): his face on a computer is the ✦ svg (.jambo-face/.jambo-mark), not an
       <img>, so the probe asks for either — an img-only probe could no longer see his face if it came back */
    /* RE-POINTED 24 Oct 2026 (ONE WINDOW WHERE THERE IS NOTHING ELSE TO SHOW, pdSolo): on the Board the panel
       holds only his words, so it is the conversation under its one tab "Jambo", his sign and his name
       (owner: "bring them back") — no Overview there */
    ok('11c on the Board the panel\'s one tab is "Jambo", wearing his sign', !!tab && tab.face && tab.word === 'Jambo', JSON.stringify(tab));
    /* 11d re-pointed 13 Oct 2026: the Breakdown face and its panel are gone, so
       its panel cannot carry an ask box; the reading's Clauses tab carries none */
    const noAsk = await page.evaluate(() => ({ lens: typeof window.bdLensHtml, ask: !!document.querySelector('#pd-thread #igd-input') }));
    ok('11d no Breakdown panel, and no ask box on the Clauses reading', noAsk.lens === 'undefined' && !noAsk.ask, JSON.stringify(noAsk));

    /* ---- 10 the "Scanning…" toast wears the turning ring ---- */
    const scanRing = await page.evaluate(async () => {
      const c = (window.state && state.contracts || [])[0]; if (!c || typeof window.runScanFor !== 'function') return 'no scan door';
      const p = window.runScanFor(c);
      const t = [...document.querySelectorAll('#toast-root [data-toast-kind]')].find(e => /Scanning/.test(e.textContent));
      const s = t && t.querySelector('.ob-spin');
      await p.catch(() => {});
      return s ? getComputedStyle(s).animationName : 'no ring';
    });
    ok('10 the "Scanning…" message carries a turning ring', scanRing === 'obSpin', scanRing);

    ok('9 no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  } catch (e){ ok('the run finished', false, e && e.message); }
  finally { await browser.close(); if (h.stop) await h.stop(); }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
