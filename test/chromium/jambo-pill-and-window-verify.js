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
   ring while it waits. */
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

    /* ---- 4 on Home, the door goes to Home's own Jambo ---- */
    await page.evaluate(f => { if (state.view === 'dashboard' && document.getElementById('hb-head')) hbSetFace(f); else { hbS().face = f; hbSave(); setView('dashboard'); } }, 'board');
    await page.click('#cmd-ai');
    const home = await page.evaluate(() => ({ open: document.getElementById('ai-panel').classList.contains('open'), focus: document.activeElement && document.activeElement.id }));
    ok('4a on Home the window does not appear; the cursor goes to Home\'s Jambo', !home.open && home.focus === 'igd-input', JSON.stringify(home));

    /* ---- 5 the window ---- */
    /* a page that is not Home: Contracts is Home's Contracts place since step 7, so Approvals —
       RE-POINTED 18 Oct 2026: Approvals now has Jambo's panel beside its list (round 15 as
       drawn), and the door goes to the Jambo already on the page (aiGoEmbedded 'list'), so the
       window is checked on a page with no Jambo of its own: the Brain */
    await page.evaluate(() => setView('brain'));
    await page.click('#cmd-ai');
    await until(page, () => document.getElementById('ai-panel').classList.contains('open'));
    const first = await page.evaluate(() => { const p = document.getElementById('ai-panel'), r = p.getBoundingClientRect();
      const face = p.querySelector('img.jambo-face'); return { cls: p.className, x: Math.round(r.right), w: Math.round(r.width), face: !!(face && /^data:image\/png/.test(face.getAttribute('src') || '')),
        title: (p.querySelector('header .font-display') || {}).textContent }; });
    ok('5a it opens as today\'s drawer on the right edge', /floating/.test(first.cls) && first.x === 1500 && first.w === 430, JSON.stringify(first));
    ok('5b it is called Jambo and shows his face', first.title === 'Jambo' && first.face, first.title);
    const hb = await (await page.$('#ai-panel > header')).boundingBox();
    await page.mouse.move(hb.x + 140, hb.y + 20); await page.mouse.down(); await page.mouse.move(hb.x - 400, hb.y + 100, { steps: 8 }); await page.mouse.up();
    let r = await (await page.$('#ai-panel')).boundingBox();
    ok('5c dragging the header moves it', Math.round(r.x) < 1070 - 300 && Math.round(r.y) > 50, `${Math.round(r.x)},${Math.round(r.y)}`);
    /* grab the corner handle itself, and say what was under the pointer if it was not the handle */
    const corner = async () => { const b = await (await page.$('#ai-panel [data-ai-rz="se"]')).boundingBox();
      const x = b.x + b.width / 2, y = b.y + b.height / 2;
      const hit = await page.evaluate(([px, py]) => { const el = document.elementFromPoint(px, py);
        return el && el.closest('[data-ai-rz="se"]') ? 'handle' : (el ? (el.id || el.className || el.tagName) + '' : 'nothing'); }, [x, y]);
      return { x, y, hit }; };
    let cn = await corner();
    await page.mouse.move(cn.x, cn.y); await page.mouse.down(); await page.mouse.move(cn.x + 1500, cn.y + 1500, { steps: 8 }); await page.mouse.up();
    r = await (await page.$('#ai-panel')).boundingBox();
    const maxW = Math.max(430, Math.min(940, Math.round(1500 * 0.72)));
    ok('5d it never grows past today\'s expanded size', Math.round(r.width) <= maxW && Math.round(r.height) <= 900, `${Math.round(r.width)}×${Math.round(r.height)} (largest ${maxW}×900; under the pointer: ${cn.hit})`);
    cn = await corner();
    await page.mouse.move(cn.x, cn.y); await page.mouse.down(); await page.mouse.move(cn.x - 1500, cn.y - 1500, { steps: 8 }); await page.mouse.up();
    r = await (await page.$('#ai-panel')).boundingBox();
    ok('5e and never shrinks below 320 × 360', Math.round(r.width) === 320 && Math.round(r.height) === 360, `${Math.round(r.width)}×${Math.round(r.height)} (under the pointer: ${cn.hit})`);
    const inside = r.x >= 0 && r.y >= 0 && r.x + r.width <= 1500 && r.y + r.height <= 900;
    ok('5f it stays inside the window', inside);
    await page.screenshot({ path: path.join(OUT, '5-window-small.png') });

    /* ---- 6 it steps aside where Jambo is on the page, and comes back ---- */
    const before = { x: Math.round(r.x), y: Math.round(r.y) };
    await page.evaluate(() => setView('dashboard'));
    const aside = await until(page, () => getComputedStyle(document.getElementById('ai-panel')).visibility === 'hidden', null, 4000);
    ok('6a on Home it steps aside', aside);
    await page.evaluate(() => setView('brain'));
    const back = await until(page, () => getComputedStyle(document.getElementById('ai-panel')).visibility === 'visible', null, 4000);
    r = await (await page.$('#ai-panel')).boundingBox();
    ok('6b leaving Home, it comes back where it was', back && Math.round(r.x) === before.x && Math.round(r.y) === before.y, `${Math.round(r.x)},${Math.round(r.y)}`);

    /* ---- 7 one press puts it back ---- */
    await page.click('#ai-dock-home');
    r = await (await page.$('#ai-panel')).boundingBox();
    ok('7a the dock button returns it to the right edge', Math.round(r.x + r.width) === 1500 && Math.round(r.width) === 430 && Math.round(r.height) === 900, `${Math.round(r.x)} ${Math.round(r.width)}×${Math.round(r.height)}`);

    /* ---- 8 his face in the chat ---- */
    const feedFace = await page.evaluate(() => !!document.querySelector('#ai-feed img.jambo-face'));
    ok('8a his face sits beside his words in the chat', feedFace);

    /* ---- 11 his face on his own doors, "Hi" in English, no ask box on the Breakdown (owner, 12 Oct 2026) ---- */
    const doors = await page.evaluate(() => ({ bar: !!document.querySelector('#cmd-ai img.jambo-face'), barSvg: !!document.querySelector('#cmd-ai svg'),
      greet: (typeof i18t === 'function' ? i18t('ai_welcome') : '').slice(0, 3), note: (typeof i18t === 'function' ? i18t('int_notebook_welcome') : '').slice(0, 3) }));
    ok('11a the top bar door shows Jambo\'s face, not the sparkle', doors.bar && !doors.barSvg, JSON.stringify(doors));
    ok('11b the greeting says Hi', doors.greet === 'Hi!' && doors.note === 'Hi!', JSON.stringify(doors));
    await page.evaluate(() => setView('dashboard'));
    await until(page, () => !!document.querySelector('#ig-dock [data-pd-tab="copilot"]'), null, 6000);
    const tab = await page.evaluate(() => { const t = document.querySelector('#ig-dock [data-pd-tab="copilot"]'); return t ? { face: !!t.querySelector('img.jambo-face'), word: (t.querySelector('.pd-tab-w') || {}).textContent } : null; });
    /* RE-POINTED 19 Oct 2026 — JAMBO AS A TAB YOU FLIP TO (owner: the panel's
       first tab is "Overview"; "Jambo" names only the conversation it flips to) */
    ok('11c the panel\'s first tab shows his face, named "Overview"', !!tab && tab.face && tab.word === 'Overview', JSON.stringify(tab));
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
