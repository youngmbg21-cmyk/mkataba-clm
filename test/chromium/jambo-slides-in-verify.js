/* ============================================================
   JAMBO SLIDES IN, THE ✦ ASK BAR, PLAIN ALWAYS, POP OUT (owner, 21 Oct 2026:
   "when i click on jambo in the side lining, let jambo slide in so that it
   looks like a jambo side panel not like the attached autonomous chatbot box.
   Also, when i click on jambo at the top of the page in the top bar, the jambo
   chat box bar should be able to appear in any window even if jambo side panel
   is there. … remove the plain and legal toggles and let jambo be plain at all
   times." And: "the chatbot can stay open even when your page is minimized so
   that you can bring the window on top of microsoft word")
   ============================================================
   Driven in a real browser, as an admin, on Jambo's agents (the page of the
   owner's screenshot) and the Brain (no Jambo panel of their own):
     1  the edge "Jambo" tab slides in a DOCKED side panel — the right edge,
        under the top bar, 384 wide, head 56, foot ≥ 56, no floating window;
        RE-POINTED 22 Oct 2026 (owner: "make it same as the others so that the
        highlighted area is not visible when expanded and you should also have
        a slider to pull jambo further to the left"): nothing dimmed, the page
        makes room beside it, the edge tab steps away while it is in and its
        own minimise brings the tab back; THE SLIDER on its left edge pulls it
        wider and the page follows, kept on the next opening, a double-click
        puts it back; at the three screens nothing sideways; Esc takes it out
     2  no Plain | Legal anywhere: no toggle, no setter, nothing stored
     3  RE-POINTED 21 Oct 2026 ("The old chat window"): the top bar's ✦ opens
        the floating chat window under the bar, over the open side panel; Esc
        closes it; ✦ again closes it (the one-line ask bar is gone)
     4  a question in that window is answered in the one conversation there,
        with the line saying what it read; a page's name moves there; nothing
        spent on the move
     5  the conversation follows you: on another page the same turns are there
     6  "What am I looking at?" stands in the panel's row and answers free
     7  a pasted letter is offered as "Start a request with this"
     8  ONE DOOR: on a list page the edge's door lands on the page's own panel
     9  POP OUT: with Document Picture-in-Picture (stubbed) the conversation and
        the box MOVE into the other window and "Put back" returns them; without
        it, a window of its own and a warning that it cannot stay on top; on a
        touch screen the control is not drawn
     10 the owner's three screens: the panel and the ✦'s window photographed, inside
        the window, nothing sideways
   AT THE PARENT (d7a320c2) 1, 2, 3, 4b, 6, 7 and 9 FAIL: the edge tab opened
   the floating window, the toggle was there, the ✦ opened the window.
     node test/chromium/jambo-slides-in-verify.js
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'jambo-slides-in');
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
const CONTRACTS = [
  H.fixtureContract('MK-S1', 'Raw Material Supply Agreement', 'Nandi Dairy', H.FOLDER_A, 800000, 'Under Review'),
  H.fixtureContract('MK-S2', 'Office lease', 'Britam Properties', H.FOLDER_B, 4e6, 'Signed'),
];
const LETTER = 'Dear Ann,\nFurther to our call, Nandi Dairy asks that the delivery window move from 14 to 21 days.\nThey also want the liability cap raised to the contract value.\nPlease confirm by Friday.\nRegards, Joe';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  await H.seedWorkspace(h, { contracts: CONTRACTS, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    const ai = []; page.on('request', r => { if (/\/api\/ai\//.test(r.url())) ai.push(r.url().replace(/^.*\/api\//, '')); });
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(100); }
      return v; };
    const shot = n => page.screenshot({ path: path.join(OUT, n + '.png') }).catch(() => {});
    /* a real press, bounded; where something covers the door (the parent's window) the press is
       made on the element so the run reports the rest rather than timing out */
    const typeIn = async (sel, words) => { if (!(await page.$(sel))) return false; await page.type(sel, words, { delay: 4 }); await page.keyboard.press('Enter'); return true; };
    const press = async sel => { try { await page.click(sel, { timeout: 3000 }); return true; }
      catch (_) { await page.evaluate(q => { const el = document.querySelector(q); if (el) el.click(); }, sel).catch(() => {}); return false; } };
    const PANEL = () => { const p = document.getElementById('ai-panel'); if (!p) return null; const r = p.getBoundingClientRect(), cs = getComputedStyle(p);
      const head = p.querySelector(':scope > header'), foot = p.querySelector(':scope > footer'), scrim = document.getElementById('ai-scrim');
      const sr = scrim && scrim.getBoundingClientRect();
      return { open: p.classList.contains('open'), side: p.classList.contains('is-side'), floating: p.classList.contains('floating'),
        x: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom), w: Math.round(r.width),
        vis: cs.visibility, radius: cs.borderTopLeftRadius, headH: head ? Math.round(head.getBoundingClientRect().height) : 0,
        footH: foot ? Math.round(foot.getBoundingClientRect().height) : 0, scrim: !!(scrim && scrim.classList.contains('open') && getComputedStyle(scrim).opacity === '1'),
        scrimTop: sr ? Math.round(sr.top) : -1, barH: Math.round((document.getElementById('top-header') || document.body).getBoundingClientRect().height),
        vw: innerWidth, vh: innerHeight }; };
    const toJambo = async () => { await page.evaluate(() => setView('jambo')); return until(() => document.querySelector('[data-jh-jambo]') ? true : null, null, 10000); };

    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    /* a reader who once chose Legal: the stored choice is forgotten on the next load */
    await page.evaluate(() => { try { localStorage.setItem('hati.v1.aiStyle', JSON.stringify('legal')); } catch (_) {} });
    await page.reload({ waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length === 2, null, { timeout: 20000 });
    await page.keyboard.press('Escape').catch(() => {});

    /* ===== 1 · THE EDGE TAB SLIDES IN A SIDE PANEL ===== */
    check('1 (setup) Jambo\'s agents carries the edge "Jambo" tab', !!(await toJambo()));
    await press('[data-jh-jambo]');
    const P1 = await until(() => { const p = document.getElementById('ai-panel'); return p && p.classList.contains('open') ? true : null; }, null, 4000)
      && await (async () => { await page.waitForTimeout(450); return page.evaluate(PANEL); })();
    check('1a the edge tab opens Jambo as a side panel, not a floating window', !!P1 && P1.open && P1.side && !P1.floating, JSON.stringify(P1));
    check('1b docked on the right edge, under the top bar, 384 wide, full height below the bar', !!P1 && P1.right === P1.vw && P1.w === 384 && P1.top === P1.barH && P1.bottom === P1.vh, JSON.stringify(P1));
    check('1c THE BRIEF: head 56, foot at least 56, square corners', !!P1 && P1.headH === 56 && P1.footH >= 56 && /^0/.test(P1.radius), JSON.stringify(P1 && { headH: P1.headH, footH: P1.footH, radius: P1.radius }));
    /* BESIDE THE PAGE (owner, 22 Oct 2026): nothing dimmed, the page's room ends where the panel starts */
    const ROOM = () => { const cs = document.getElementById('content-scroll'), p = document.getElementById('ai-panel'), tab = document.querySelector('[data-jh-jambo]');
      const tr = tab && tab.getBoundingClientRect(); const hit = tr && tr.width ? document.elementFromPoint(tr.left + tr.width / 2, tr.top + 40) : null;
      return { pageRight: Math.round(cs.getBoundingClientRect().right), panelLeft: Math.round(p.getBoundingClientRect().left), panelW: Math.round(p.getBoundingClientRect().width),
        tabShown: !!(tr && tr.width && hit && hit.closest('[data-jh-jambo]')), side: document.documentElement.scrollWidth <= innerWidth + 1 }; };
    const R1 = await page.evaluate(ROOM);
    check('1d nothing is dimmed: the page makes room beside the panel, its right edge where the panel starts', !!P1 && !P1.scrim && Math.abs(R1.pageRight - R1.panelLeft) <= 1, JSON.stringify({ scrim: P1 && P1.scrim, ...R1 }));
    check('1e the edge "Jambo" tab steps away while the panel is in (as Home\'s folded strip does)', !R1.tabShown, JSON.stringify(R1));
    await shot('1-side-panel-1440x780');
    /* THE SLIDER: the one every Jambo panel has, on the panel's left edge */
    const G = await page.evaluate(() => { const g = document.getElementById('ai-side-rez'); if (!g) return null; const r = g.getBoundingClientRect(), p = document.getElementById('ai-panel').getBoundingClientRect();
      const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { shown: !g.hidden && r.width > 0, atEdge: Math.abs(r.left - p.left) <= 2, painted: !!(el && el.closest('#ai-side-rez')), x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    check('1h the panel has THE SLIDER on its left edge, painted where it stands', !!G && G.shown && G.atEdge && G.painted, JSON.stringify(G));
    if (G && G.shown) {
      await page.mouse.move(G.x, G.y); await page.mouse.down(); await page.mouse.move(G.x - 120, G.y, { steps: 6 }); await page.mouse.move(G.x - 200, G.y, { steps: 6 }); await page.mouse.up();
      const R2 = await until(() => { const p = document.getElementById('ai-panel').getBoundingClientRect(), cs = document.getElementById('content-scroll').getBoundingClientRect();
        return p.width >= 560 ? { panelW: Math.round(p.width), pageRight: Math.round(cs.right), panelLeft: Math.round(p.left) } : null; }, null, 3000);
      check('1i pulled 200px to the left, Jambo is that much wider and the page follows', !!R2 && Math.abs(R2.panelW - 584) <= 4 && Math.abs(R2.pageRight - R2.panelLeft) <= 1, JSON.stringify(R2));
      await shot('1-side-panel-wider-1440x780');
      await page.click('#ai-min');
      const back = await until(() => { const p = document.getElementById('ai-panel'), t = document.querySelector('[data-jh-jambo]');
        return !p.classList.contains('open') && t && t.getBoundingClientRect().width > 0 ? true : null; }, null, 3000);
      check('1f its own minimise puts it away and the edge tab is back', !!back);
      await press('[data-jh-jambo]');
      const kept = await until(() => { const p = document.getElementById('ai-panel'); return p.classList.contains('open') ? Math.round(p.getBoundingClientRect().width) : null; }, null, 3000);
      await page.waitForTimeout(450);
      const keptW = await page.evaluate(() => Math.round(document.getElementById('ai-panel').getBoundingClientRect().width));
      check('1j opened again, it keeps the width the reader chose', !!kept && Math.abs(keptW - 584) <= 4, JSON.stringify({ keptW }));
      await page.dblclick('#ai-side-rez');
      const rest = await until(() => Math.round(document.getElementById('ai-panel').getBoundingClientRect().width) === 384 ? true : null, null, 3000);
      check('1k a double-click on the slider puts the resting width back', !!rest);
      for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
        await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(350);
        const R3 = await page.evaluate(ROOM);
        check(`1l ${w}×${ht}: beside the page, nothing dimmed, nothing sideways`, Math.abs(R3.pageRight - R3.panelLeft) <= 1 && R3.side && !R3.tabShown, JSON.stringify(R3));
        await shot(`1-side-panel-${w}x${ht}`);
      }
      await page.setViewportSize({ width: 1440, height: 780 }); await page.waitForTimeout(300);
      await page.click('#ai-min');
    } else check('1f its own minimise puts it away and the edge tab is back', false, 'no slider to drive the rest');
    const shut = await until(() => !document.getElementById('ai-panel').classList.contains('open') ? true : null, null, 3000);
    await press('[data-jh-jambo]');
    await until(() => document.getElementById('ai-panel').classList.contains('open') ? true : null, null, 3000);
    await page.keyboard.press('Escape');
    check('1g Esc takes it out', !!(await until(() => !document.getElementById('ai-panel').classList.contains('open') ? true : null, null, 3000)));

    /* ===== 2 · NO PLAIN | LEGAL ===== */
    await press('[data-jh-jambo]');
    await until(() => document.getElementById('ai-panel').classList.contains('open') ? true : null, null, 3000);
    const P2 = await page.evaluate(() => { const p = document.getElementById('ai-panel');
      const words = [...p.querySelectorAll('button')].map(b => b.textContent.trim()).filter(Boolean);
      return { toggle: !!document.getElementById('ai-style'), setter: typeof window.aiSetStyle, words: words.filter(w => /^(Plain|Legal|Answers)$/.test(w)),
        caption: /\bAnswers\b/.test(p.textContent), stored: localStorage.getItem('hati.v1.aiStyle') }; });
    check('2 no Plain | Legal toggle, no setter, the old stored choice forgotten', !P2.toggle && P2.setter === 'undefined' && !P2.words.length && !P2.caption && P2.stored === null, JSON.stringify(P2));

    /* ===== 3 · THE ✦ OPENS THE CHAT WINDOW, OVER THE OPEN SIDE PANEL =====
       RE-POINTED 21 Oct 2026 (owner picked "The old chat window": "the highlighted area is what
       shows up as a chatbot pop up, then when i type in it, it just jumps to the jambo in the side
       panel. It is not the old chatbot i had"): the ✦ no longer drops a one-line bar; it opens the
       floating window you can move and resize, under the top bar; Esc closes it; ✦ again closes it.
       Its own check: jambo-chat-window-verify.js */
    await press('#cmd-ai');
    const B = await until(() => { const p = document.getElementById('ai-panel'); if (!p.classList.contains('open') || !p.classList.contains('floating')) return null;
      const r = p.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { top: Math.round(r.top), barH: Math.round(document.getElementById('top-header').getBoundingClientRect().height), side: p.classList.contains('is-side'),
        onTop: !!(top && top.closest('#ai-panel')), focus: document.activeElement && document.activeElement.id, bar: !!document.getElementById('jb-bar'), card: !!p.querySelector('.jb-card') }; }, null, 3000);
    check('3a the ✦ over the open side panel opens the floating chat window, the cursor in its box (no one-line bar)', !!B && !B.side && B.card && !B.bar && B.focus === 'ai-input', JSON.stringify(B));
    check('3b it stands under the top bar, on top', !!B && B.top >= B.barH && B.onTop, JSON.stringify(B));
    await shot('3-window-1440x780');
    await page.keyboard.press('Escape');
    const B2 = await page.evaluate(() => ({ open: document.getElementById('ai-panel').classList.contains('open'), bar: !!document.getElementById('jb-bar') }));
    check('3c Esc closes the window', !B2.open && !B2.bar, JSON.stringify(B2));
    await press('#cmd-ai'); await until(() => document.getElementById('ai-panel').classList.contains('open') ? true : null, null, 2000);
    await press('#cmd-ai');
    check('3d the ✦ pressed again closes it', !(await page.evaluate(() => document.getElementById('ai-panel').classList.contains('open'))));

    /* ===== 4 · A QUESTION IN THE ✦'S WINDOW, ANSWERED IN THE ONE CONVERSATION (re-pointed 21 Oct 2026) ===== */
    await page.evaluate(() => { if (typeof closeAI === 'function') closeAI(); if (typeof clearAIHistory === 'function') clearAIHistory(); });
    await press('#cmd-ai'); await until(() => document.getElementById('ai-panel').classList.contains('open') ? true : null, null, 2000);
    await typeIn('#ai-input', 'How many drafts do I have?');
    const A = await until(() => { const p = document.getElementById('ai-panel'); const msgs = [...document.querySelectorAll('#ai-feed .ai-msg')];
      const asked = msgs.some(m => /How many drafts/.test(m.textContent)); const read = document.querySelector('#ai-feed .ai-read');
      return p.classList.contains('open') && asked && read ? { read: read.textContent.trim(), floating: p.classList.contains('floating'), n: (window.ai && ai.history.length) } : null; }, null, 6000);
    check('4a the window\'s question is answered in the window\'s one conversation', !!A && A.floating && A.n >= 2, JSON.stringify(A));
    check('4b the answer says what it read', !!A && /^Read from /.test(A.read), JSON.stringify(A));
    ai.length = 0;
    await typeIn('#ai-input', 'obligations');
    const V = await until(() => state.view === 'obligations' ? state.view : null, null, 6000);
    check('4c a page\'s name in the window moves there (the one reader), nothing spent', V === 'obligations' && !ai.length, JSON.stringify({ view: V, ai }));
    await page.evaluate(() => { if (typeof closeAI === 'function') closeAI(); });

    /* ===== 5 · THE CONVERSATION FOLLOWS YOU ===== */
    await page.evaluate(() => setView('brain'));
    await until(() => state.view === 'brain' ? true : null, null, 4000);
    await page.evaluate(() => openAI());
    const F = await until(() => { const t = document.getElementById('ai-feed').textContent; return document.getElementById('ai-panel').classList.contains('open') && /How many drafts/.test(t) ? { side: document.getElementById('ai-panel').classList.contains('is-side') } : null; }, null, 4000);
    check('5 on another page the same conversation is there, in the side panel', !!F && F.side, JSON.stringify(F));

    /* ===== 6 · "WHAT AM I LOOKING AT?" — FREE ===== */
    ai.length = 0;
    const chip = await page.$('#ai-suggest [data-ai-here]');
    check('6a "What am I looking at?" stands in the panel\'s row', !!chip);
    if (chip) {
      await chip.click();
      const W = await until(() => { const last = [...document.querySelectorAll('#ai-feed .ai-msg')].pop(); return last && /no Jambo call/i.test(last.textContent) ? last.textContent.replace(/\s+/g, ' ').trim().slice(0, 160) : null; }, null, 3000);
      check('6b he says the screen in front from its own counts, and spends nothing', !!W && /Brain/.test(W) && !ai.length, JSON.stringify({ W, ai }));
    }

    /* 6c THE SAME QUESTION IN HOME'S OWN BOX (21 Oct 2026): beside a paper, typed into Jambo's panel, it is
       the same free reading in the one conversation — no model call guessing the screen */
    await page.evaluate(() => { if (window.closeAI) try { closeAI(); } catch (_) {} pdOpenOnHome('MK-S1', 'copilot'); });
    const box = await until(() => !!document.getElementById('igd-input') && window.intel && intel.paper && intel.paper.id === 'MK-S1' && !!document.getElementById('ig-canvas'), null, 10000);
    ai.length = 0;
    if (box) { await page.fill('#igd-input', 'What am I looking at?'); await page.press('#igd-input', 'Enter'); }
    const HW = await until(() => { const t = (document.getElementById('igd-feed') || {}).textContent || ''; return /no Jambo call/i.test(t) ? t.replace(/\s+/g, ' ').slice(-220) : null; }, null, 4000);
    check('6c typed into Home\'s box beside a paper: the same free reading of the page, the contract named, nothing spent', !!HW && /MK-S1/.test(HW) && !ai.length, JSON.stringify({ HW, ai }));

    /* ===== 7 · A PASTED LETTER ===== */
    await page.evaluate(t => { const inp = document.getElementById('ai-input'); inp.focus(); const dt = new window.DataTransfer(); dt.setData('text/plain', t);
      inp.dispatchEvent(new window.ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })); }, LETTER);
    const PST = await until(() => { const b = document.querySelector('#ai-suggest [data-ai-paste="request"]'); return b ? b.textContent.trim() : null; }, null, 2000);
    check('7 a pasted letter is offered as a request', !!PST && /request/i.test(PST), String(PST));
    await page.evaluate(() => { if (typeof closeAI === 'function') closeAI(); });

    /* ===== 8 · ONE DOOR beside a list ===== */
    await page.evaluate(() => setView('approvals'));
    await until(() => state.view === 'approvals' && window.jlOnScreen && jlOnScreen() ? true : null, null, 8000);
    await page.evaluate(() => (window.aiSideToggle ? aiSideToggle() : openAI()));
    const O = await page.evaluate(() => ({ window: document.getElementById('ai-panel').classList.contains('open'), focus: document.activeElement && document.activeElement.id }));
    check('8 on a list page the door lands on the page\'s own Jambo panel, never a second one', !O.window && O.focus === 'jl-q', JSON.stringify(O));

    /* ===== 9 · POP OUT ===== */
    await toJambo();
    /* the API stubbed (defined over the browser's own, so the press is counted) */
    await page.evaluate(() => { window.__pipAsked = 0; Object.defineProperty(window, 'documentPictureInPicture', { configurable: true, writable: true,
      value: { requestWindow: async () => { window.__pipAsked++; return window.open('', 'pip-stub', 'width=420,height=640'); } } }); });
    await press('[data-jh-jambo]');
    await until(() => document.getElementById('ai-panel').classList.contains('open') ? true : null, null, 3000);
    const pb = await page.evaluate(() => { const b = document.getElementById('ai-popout'); return b ? { hidden: b.hidden, shown: b.getClientRects().length > 0 } : null; });
    check('9a Pop out is in the panel\'s head on a computer', !!pb && !pb.hidden && pb.shown, JSON.stringify(pb));
    const popP = ctx.waitForEvent('page', { timeout: 5000 }).catch(() => null);
    await press('#ai-popout');
    const pip = await popP;
    const M = await until(() => { if (!window.aiPopped || !aiPopped()) return null; return { asked: window.__pipAsked, mainFeed: !!document.getElementById('ai-feed'), mainInput: !!document.getElementById('ai-input'),
      panelOpen: document.getElementById('ai-panel').classList.contains('open'), warned: [...document.querySelectorAll('#toast-root [data-toast-kind="warn"]')].length }; }, null, 5000);
    check('9b with Picture-in-Picture the conversation and the box MOVE into Jambo\'s own window (no warning)', !!M && M.asked === 1 && !M.mainFeed && !M.mainInput && !M.panelOpen && !M.warned, JSON.stringify(M));
    if (pip) {
      const inPip = await pip.evaluate(() => ({ feed: !!document.getElementById('ai-feed'), input: !!document.getElementById('ai-input'), back: !!document.querySelector('[data-ai-popback]'),
        styled: document.querySelectorAll('style').length > 3, words: /How many drafts/.test((document.getElementById('ai-feed') || {}).textContent || '') })).catch(e => ({ err: String(e) }));
      check('9c the other window wears HaTi\'s clothes and carries the same conversation', !!inPip && inPip.feed && inPip.input && inPip.back && inPip.styled && inPip.words, JSON.stringify(inPip));
      await pip.waitForTimeout(500).catch(() => {});
      await pip.screenshot({ path: path.join(OUT, '9-popped-out.png') }).catch(() => {});
      await pip.click('[data-ai-popback]').catch(() => {});
      const back = await until(() => !aiPopped() && document.getElementById('ai-feed') && document.getElementById('ai-panel').classList.contains('open') ? true : null, null, 5000);
      check('9d "Put back" returns Jambo to the side panel', !!back);
    } else check('9c (setup) the other window opened', false);
    /* and absent, as in Safari and Firefox */
    await page.evaluate(() => { Object.defineProperty(window, 'documentPictureInPicture', { configurable: true, writable: true, value: undefined }); if (typeof closeAI === 'function') closeAI(); });
    await press('[data-jh-jambo]');
    await until(() => document.getElementById('ai-panel').classList.contains('open') ? true : null, null, 3000);
    const popQ = ctx.waitForEvent('page', { timeout: 5000 }).catch(() => null);
    await press('#ai-popout');
    const plain = await popQ;
    const N = await until(() => { if (!aiPopped()) return null; const t = [...document.querySelectorAll('#toast-root [data-toast-kind="warn"]')].map(x => x.textContent).join(' ');
      return { warned: /cannot keep it on top/.test(t), t: t.slice(0, 140) }; }, null, 5000);
    check('9e without it, a window of its own, and Jambo says plainly it cannot stay on top', !!plain && !!N && N.warned, JSON.stringify(N));
    if (plain) { await plain.close().catch(() => {}); }
    const back2 = await until(() => !aiPopped() && document.getElementById('ai-feed') ? true : null, null, 5000);
    check('9f closing that window puts Jambo back', !!back2);
    await page.evaluate(() => { if (typeof closeAI === 'function') closeAI(); });
    const touch = await browser.newContext({ viewport: { width: 1366, height: 950 }, hasTouch: true, isMobile: false });
    const tp = await touch.newPage();
    await tp.goto(h.base + '/', { waitUntil: 'networkidle' });
    await tp.fill('#li-email', 'admin@example.co.ke'); await tp.fill('#li-pass', 'adminpassword1'); await tp.click('#li-go');
    await tp.waitForFunction(() => window.state && state.contracts && state.contracts.length === 2, null, { timeout: 20000 });
    await tp.evaluate(() => { setView('brain'); openAI(); });
    await tp.waitForTimeout(400);
    const tpb = await tp.evaluate(() => { const b = document.getElementById('ai-popout'); return { coarse: matchMedia('(pointer: coarse)').matches, hidden: !b || b.hidden || !b.getClientRects().length }; });
    check('9g on a touch screen (the iPad) Pop out is not drawn', tpb.hidden, JSON.stringify(tpb));
    await touch.close();

    /* ===== 10 · THE OWNER'S THREE SCREENS ===== */
    for (const [w, hh] of SCREENS) {
      await page.setViewportSize({ width: w, height: hh });
      await toJambo();
      await press('[data-jh-jambo]');
      await until(() => document.getElementById('ai-panel').classList.contains('open') ? true : null, null, 3000);
      await page.waitForTimeout(400);
      const S = await page.evaluate(PANEL);
      await shot(`10-panel-${w}x${hh}`);
      /* re-pointed 21 Oct 2026: the ✦ opens the chat window (no bar) */
      await press('#cmd-ai'); await until(() => document.getElementById('ai-panel').classList.contains('floating') ? true : null, null, 2000);
      const S2 = await page.evaluate(() => { const r = document.getElementById('ai-panel').getBoundingClientRect(); return { l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top), b: Math.round(r.bottom), sx: document.scrollingElement.scrollWidth > innerWidth }; });
      check(`10 at ${w}×${hh}: the panel at the edge 384 wide, the ✦'s window inside the screen, nothing sideways`, S.right === w && S.w === 384 && S.top === S.barH && S2.l >= 0 && S2.r <= w && S2.t >= S.barH && S2.b <= hh && !S2.sx, JSON.stringify({ S: { right: S.right, w: S.w, top: S.top }, S2 }));
      await shot(`10-window-${w}x${hh}`);
      await page.keyboard.press('Escape');
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
