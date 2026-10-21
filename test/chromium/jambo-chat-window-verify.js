/* ============================================================
   THE ✦ OPENS THE OLD CHAT WINDOW (owner, 21 Oct 2026: "the highlighted area
   is what shows up as a chatbot pop up, then when i type in it, it just jumps
   to the jambo in the side panel. It is not the old chatbot i had." Picked by
   name: "The old chat window")
   ============================================================
   Driven in a real browser, as an admin:
     1  the top bar's ✦ opens the floating chat window (the one you can move
        and resize) on Home, on a list page (Approvals) and in Settings — each
        a page with its own Jambo panel — shown, on top, not stepped aside;
        no one-line ask bar anywhere; the ✦ again closes it, Esc closes it
     2  what is typed in the window is answered IN the window: the question and
        an answer land in its own feed, the page's own Jambo draws nothing of
        it, and the page does not change
     3  the window draws the ONE conversation: a question asked in Home's own
        box is in the window; while the window shows it Home's panel says the
        words are in Jambo's window; closed, Home draws the whole conversation
        again, the window's question included
     4  the edge "Jambo" tab still slides in the side panel (384 wide, the
        right edge, under the bar), and from the ✦'s window it changes the
        window into the side panel; beside a list it still lands on the list's
        own Jambo
     5  the owner's three screens: the window photographed on Home, inside the
        screen, nothing sideways
   AT THE PARENT (main, db763d0) 12 FAIL (1a, 1d, 1e, 2a–2c, 3b, 4b, 4c, 5): the ✦ dropped a one-line
   bar, and what was typed went to the page's own Jambo.
     node test/chromium/jambo-chat-window-verify.js
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'jambo-chat-window');
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
const CONTRACTS = [
  H.fixtureContract('MK-W1', 'Raw Material Supply Agreement', 'Nandi Dairy', H.FOLDER_A, 800000, 'Under Review'),
  H.fixtureContract('MK-W2', 'Office lease', 'Britam Properties', H.FOLDER_B, 4e6, 'Signed'),
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  await H.seedWorkspace(h, { contracts: CONTRACTS, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(String(e.message || e).slice(0, 200)));
    /* A WAIT ASKS FOR THE STATE, BOUNDED */
    const until = async (fn, arg, ms = 8000) => { const end = Date.now() + ms;
      while (Date.now() < end) { const v = await page.evaluate(fn, arg).catch(() => null); if (v) return v; await new Promise(r => setTimeout(r, 100)); } return null; };
    const shot = n => page.screenshot({ path: path.join(OUT, n + '.png') }).catch(() => {});
    const quiet = () => until(() => !(window.intel && intel.busy) && !(window.ai && ai.busy) ? true : null, null, 15000);
    /* a real press, bounded; a door covered or missing is pressed on the element so the run reports the rest */
    const press = async sel => { try { await page.click(sel, { timeout: 3000 }); return true; }
      catch (_) { await page.evaluate(q => { const el = document.querySelector(q); if (el) el.click(); }, sel).catch(() => {}); return false; } };
    const ask = async (sel, words) => { if (!(await page.$(sel))) return false;
      try { await page.click(sel, { timeout: 2000 }); } catch (_) { await page.focus(sel).catch(() => {}); }
      await page.type(sel, words, { delay: 3 }); await page.keyboard.press('Enter'); return true; };
    /* the window as the reader sees it: open, floating, visible, the thing on top at its middle */
    const WIN = () => { const p = document.getElementById('ai-panel'); if (!p) return null; const r = p.getBoundingClientRect(), cs = getComputedStyle(p);
      const hit = document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2));
      const inp = document.getElementById('ai-input'), ir = inp && inp.getBoundingClientRect();
      const inHit = ir && document.elementFromPoint(Math.round(ir.left + ir.width / 2), Math.round(ir.top + ir.height / 2));
      return { open: p.classList.contains('open'), floating: p.classList.contains('floating'), side: p.classList.contains('is-side'),
        aside: p.classList.contains('ai-stepaside'), vis: cs.visibility, onTop: !!(hit && hit.closest('#ai-panel')), boxOnTop: !!(inHit && inHit.closest('#ai-panel')),
        x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right), bottom: Math.round(r.bottom),
        bar: !!document.getElementById('jb-bar'), vw: innerWidth, vh: innerHeight, sx: document.scrollingElement.scrollWidth > innerWidth }; };
    const winUp = r => !!r && r.open && r.floating && !r.side && !r.aside && r.vis === 'visible' && r.onTop && r.boxOnTop && !r.bar;
    const closeWin = () => page.evaluate(() => { if (window.ai && ai.open && typeof closeAI === 'function') closeAI(); const b = document.getElementById('jb-bar'); if (b) b.remove(); });
    const toHome = async () => {
      await page.evaluate(() => { setView('dashboard'); if (window.hbFace && hbFace() !== 'board') hbSetFace('board'); intel.dockOpen = true; renderIntelDock(); });
      return until(() => !!document.getElementById('igd-input') && document.getElementById('ig-dock').getClientRects().length ? true : null, null, 8000);
    };

    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(() => window.state && state.contracts && state.contracts.length >= 2 ? true : null, null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => { if (langId() !== 'en') langSet('en'); if (window.aiConvoClear) aiConvoClear(); });

    /* ===== 3 (first half) · A QUESTION ASKED IN HOME'S OWN BOX ===== */
    check('0 (setup) Home with its own Jambo panel', !!(await toHome()));
    await page.evaluate(() => { if (window.pdTalkReopen) pdTalkReopen(); });
    await ask('#igd-input', 'What am I looking at?');
    await quiet();
    const seeded = await until(() => window.ai && ai.history.some(m => /What am I looking at/.test(m.text || m.raw || '')) ? true : null, null, 6000);
    check('3a (setup) a question asked in Home\'s own box is in the one conversation', !!seeded);

    /* ===== 1 · THE ✦ OPENS THE WINDOW ON HOME ===== */
    await press('#cmd-ai');
    const W1 = await until(() => { const p = document.getElementById('ai-panel'); return p && p.classList.contains('open') ? true : null; }, null, 3000)
      && await page.evaluate(WIN);
    check('1a on Home the ✦ opens the floating chat window, shown on top beside Home\'s own Jambo (no one-line bar)', winUp(W1), JSON.stringify(W1));
    const view0 = await page.evaluate(() => state.view);

    /* ===== 3 · THE WINDOW DRAWS THE ONE CONVERSATION ===== */
    const C3 = await page.evaluate(() => ({ inWin: /What am I looking at/.test((document.getElementById('ai-feed') || {}).textContent || ''),
      dockTurns: document.querySelectorAll('#ig-dock .jb-turn').length, dockSays: /in its own window/.test((document.getElementById('ig-dock') || {}).textContent || '') }));
    check('3b the window shows the question asked in Home\'s box; Home\'s panel draws no copy and says the words are in Jambo\'s window', C3.inWin && !C3.dockTurns && C3.dockSays, JSON.stringify(C3));

    /* ===== 2 · TYPED IN THE WINDOW, ANSWERED IN THE WINDOW ===== */
    const n0 = await page.evaluate(() => ai.history.length);
    await ask('#ai-input', 'Show me the contracts with Nandi Dairy');
    await quiet();
    const A1 = await until(n => { const f = document.getElementById('ai-feed'); const msgs = f ? [...f.querySelectorAll('.jb-turn, .ai-msg')] : [];
      const qi = msgs.findIndex(m => /contracts with Nandi Dairy/.test(m.textContent));
      return qi >= 0 && msgs.length > qi + 1 && ai.history.length >= n + 2 ? { turns: msgs.length, open: document.getElementById('ai-panel').classList.contains('open'),
        dock: /contracts with Nandi Dairy/.test((document.getElementById('ig-dock') || {}).textContent || ''), view: state.view } : null; }, n0, 8000);
    check('2a on Home a question typed in the window is answered in the window, never in Home\'s panel', !!A1 && A1.open && !A1.dock && A1.view === view0, JSON.stringify(A1));
    await shot('home-window-answer-1440x780');

    /* ===== 1 · THE ✦ AGAIN, AND ESC ===== */
    await press('#cmd-ai');
    const shut = await until(() => !document.getElementById('ai-panel').classList.contains('open') ? true : null, null, 3000);
    check('1b the ✦ pressed again closes the window (PRESS IT AGAIN AND IT CLOSES)', !!shut);
    /* ===== 3 · CLOSED, HOME DRAWS THE WHOLE CONVERSATION AGAIN ===== */
    await page.evaluate(() => { if (window.pdTalkReopen) pdTalkReopen(); });
    const back = await until(() => { const t = (document.getElementById('ig-dock') || {}).textContent || ''; return /What am I looking at/.test(t) && /contracts with Nandi Dairy/.test(t) ? true : null; }, null, 5000);
    check('3c closed, Home\'s panel draws the one conversation again, the window\'s question in it', !!back);
    await press('#cmd-ai');
    await until(() => document.getElementById('ai-panel').classList.contains('open') ? true : null, null, 3000);
    await page.keyboard.press('Escape');
    check('1c Esc closes it', !!(await until(() => !document.getElementById('ai-panel').classList.contains('open') ? true : null, null, 3000)));

    /* ===== 1 + 2 · ON A LIST PAGE ===== */
    await page.evaluate(() => setView('approvals'));
    const onList = await until(() => state.view === 'approvals' && window.jlOnScreen && jlOnScreen() ? true : null, null, 8000);
    check('0 (setup) Approvals with Jambo\'s panel beside the list', !!onList);
    await press('#cmd-ai');
    await until(() => document.getElementById('ai-panel').classList.contains('open') ? true : null, null, 3000);
    const W2 = await page.evaluate(WIN);
    check('1d on a list page the ✦ opens the window, shown on top beside the list\'s own Jambo', winUp(W2), JSON.stringify(W2));
    const n1 = await page.evaluate(() => ai.history.length);
    await ask('#ai-input', 'How many drafts do I have?');
    await quiet();
    const A2 = await until(n => { const f = document.getElementById('ai-feed'); const t = f ? f.textContent : '';
      return /How many drafts do I have/.test(t) && ai.history.length >= n + 2 ? { open: document.getElementById('ai-panel').classList.contains('open'),
        list: /How many drafts/.test((document.getElementById('jl-feed') || {}).textContent || ''), view: state.view } : null; }, n1, 8000);
    check('2b on a list page it is answered in the window, not in the list\'s panel', !!A2 && A2.open && !A2.list && A2.view === 'approvals', JSON.stringify(A2));
    await shot('list-window-1440x780');
    await closeWin();

    /* ===== 1 + 2 · IN SETTINGS ===== */
    await page.evaluate(() => setView('team'));
    const onSet = await until(() => state.view === 'team' && document.getElementById('st-side') && document.getElementById('st-side').getClientRects().length ? true : null, null, 8000);
    check('0 (setup) Settings with its own Jambo side', !!onSet);
    await press('#cmd-ai');
    await until(() => document.getElementById('ai-panel').classList.contains('open') ? true : null, null, 3000);
    const W3 = await page.evaluate(WIN);
    check('1e in Settings the ✦ opens the window, shown on top beside Settings\' own Jambo', winUp(W3), JSON.stringify(W3));
    const n2 = await page.evaluate(() => ai.history.length);
    await ask('#ai-input', 'Which contract has the highest value?');
    await quiet();
    const A3 = await until(n => { const f = document.getElementById('ai-feed'); const t = f ? f.textContent : '';
      return /highest value/.test(t) && ai.history.length >= n + 2 ? { open: document.getElementById('ai-panel').classList.contains('open'),
        st: /highest value/.test((document.getElementById('st-jb-feed') || {}).textContent || ''), view: state.view } : null; }, n2, 8000);
    check('2c in Settings it is answered in the window, not in Settings\' side', !!A3 && A3.open && !A3.st && A3.view === 'team', JSON.stringify(A3));
    await shot('settings-window-1440x780');

    /* ===== 4 · THE EDGE TAB STILL SLIDES IN THE SIDE PANEL ===== */
    await closeWin();
    await page.evaluate(() => setView('jambo'));
    await until(() => document.querySelector('[data-jh-jambo]') ? true : null, null, 10000);
    await press('[data-jh-jambo]');
    await until(() => document.getElementById('ai-panel').classList.contains('open') ? true : null, null, 3000);
    await page.waitForTimeout(450);   // the slide-in's transition, so the rect is where it rests
    const S1 = await page.evaluate(() => { const p = document.getElementById('ai-panel'), r = p.getBoundingClientRect();
      return { side: p.classList.contains('is-side'), floating: p.classList.contains('floating'), right: Math.round(r.right), w: Math.round(r.width), top: Math.round(r.top),
        barH: Math.round(document.getElementById('top-header').getBoundingClientRect().height), vw: innerWidth }; });
    check('4a the edge "Jambo" tab slides in the side panel: the right edge, 384 wide, under the bar', S1.side && !S1.floating && S1.right === S1.vw && S1.w === 384 && S1.top === S1.barH, JSON.stringify(S1));
    await press('#cmd-ai');
    const S2 = await until(() => { const p = document.getElementById('ai-panel'); return p.classList.contains('open') && p.classList.contains('floating') ? { side: p.classList.contains('is-side') } : null; }, null, 3000);
    check('4b the ✦ over the open side panel opens the chat window', !!S2 && !S2.side, JSON.stringify(S2));
    await press('[data-jh-jambo]');
    const S3 = await until(() => { const p = document.getElementById('ai-panel'); return p.classList.contains('open') && p.classList.contains('is-side') && !p.classList.contains('floating') ? true : null; }, null, 3000);
    check('4c the edge tab from the chat window slides the side panel in', !!S3);
    await closeWin();
    await page.evaluate(() => setView('approvals'));
    await until(() => state.view === 'approvals' && window.jlOnScreen && jlOnScreen() ? true : null, null, 8000);
    await page.evaluate(() => aiSideToggle());
    const O = await page.evaluate(() => ({ window: document.getElementById('ai-panel').classList.contains('open'), focus: document.activeElement && document.activeElement.id }));
    check('4d beside a list the edge door still lands on the list\'s own Jambo', !O.window && O.focus === 'jl-q', JSON.stringify(O));

    /* ===== 5 · THE OWNER'S THREE SCREENS ===== */
    for (const [w, hh] of SCREENS) {
      await closeWin();
      await page.setViewportSize({ width: w, height: hh });
      await toHome();
      await press('#cmd-ai');
      await until(() => document.getElementById('ai-panel').classList.contains('open') ? true : null, null, 3000);
      await page.waitForTimeout(300);
      const S = await page.evaluate(WIN);
      check(`5 at ${w}×${hh}: the chat window open on Home, inside the screen, nothing sideways`, winUp(S) && S.x >= 0 && S.y >= 0 && S.right <= w && S.bottom <= hh && !S.sx, JSON.stringify(S));
      await shot(`window-on-home-${w}x${hh}`);
    }

    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.stack ? e.stack.slice(0, 500) : String(e));
  } finally {
    await browser.close().catch(() => {}); await h.stop().catch(() => {});
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
