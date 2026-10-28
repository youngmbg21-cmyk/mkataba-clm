/* Chromium verification: ONE WINDOW, THE BAR IN COLOUR, JAMBO'S CARDS (owner, 24 Oct 2026; the work order
   docs/WORKORDER-one-window-jambo-and-sap-bar.md, parts A–C)
   ============================================================
     A  one window where a panel holds only Jambo's words: the Board, Explorer (beside its own Findings · Guide),
        the Contracts place, a list page with nothing chosen (Requests), Settings and the Calendar draw no
        Overview / Jambo tabs, no word beside them and no trail; a question's answer lands under his words with
        nothing turned. The Dossier and a chosen standard keep their two tabs.
     B  the top bar "The SAP way": deep green, every word and icon in it white (≥ 4.5:1), the Recent menu a white card
     C  Jambo's cards "The Legora way": a Settings card and his own card are one soft grey, no edge, 18px round;
        "Found without AI · free" sits inside the card (≥ 12px from its left edge), the "Read from" line below it
     D  photos at the owner's three screens; no page errors
   Run: node test/chromium/one-window-bar-cards-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'one-window-bar-cards');
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
let failures = 0;
const check = (name, pass, detail) => { console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); if (!pass) failures++; };
const deliver = answer => [{ type: 'tool_use', id: 'tu_o', name: 'deliver_answer', input: { answer, citations: [] } }];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const ai = await startScriptedAi();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base, HATI_AGENTS_AUTO: 'off' });
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-B2'), null, { timeout: 20000 });

    /* what the panel on the right shows: its visible tabs, a word beside them, a trail */
    const panelHead = sel => page.evaluate(s => {
      const p = document.querySelector(s); if (!p) return null;
      const vis = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
      const tabs = [...p.querySelectorAll('.pd-tab, .st-side-tab')].filter(vis).map(t => t.textContent.replace(/\s+/g, ' ').trim());
      const word = [...p.querySelectorAll('.igd-head-w, .jl-word, .st-side-word, .pd-head-word')].filter(vis).map(w => w.textContent.trim());
      const trail = [...p.querySelectorAll('.pd-trail')].filter(vis).length;
      const door = ([...p.querySelectorAll('[data-jb-door] .jb-door-back')].filter(vis)[0] || { textContent: '' }).textContent.trim();
      return { tabs, word, trail, door };
    }, sel);
    /* RE-POINTED 28 Oct 2026 (owner picked "Door above the box"): NO Jambo tab on any landing; in the conversation the
       head is his name alone and "‹ Overview" stands above the box — every claim below reads that */
    const noJb = x => !!x && !x.tabs.some(t => /Jambo/.test(t));
    /* (the one-window reader "one" is retired: owner, 26 Oct 2026, "Yes, every page" — every panel has Overview, then Jambo) */

    console.log('\nA · one window where the panel holds only his words');
    const homeFace = f => page.evaluate(x => { setView('dashboard'); intel.paper = null; hbSetFace(x); }, f);
    await homeFace('board');
    await until(() => !!document.getElementById('igd-input') && window.pdSolo && pdSolo());
    const A1 = await panelHead('#ig-dock');
    A1.hello = await page.evaluate(() => !!document.querySelector('#ig-dock [data-jb-hello]'));
    /* RE-POINTED 26 Oct 2026 (owner: "any page where there is a link to press on the first page needs a second
       tab for jambo"; reverses the Board's one window of the same day): his greeting and its chips are the
       Board's first page, under Overview; his conversation under the Jambo tab beside it; still no page word */
    check('A1 the Board: Overview (his cards and chips), no Jambo tab; no word, no trail on the landing', !!A1 && A1.tabs.some(t => /Overview|Översikt/.test(t)) && noJb(A1) && A1.word.length === 0 && A1.trail === 0, JSON.stringify(A1));
    ai.reset(); ai.script(deliver('Two things want you this week.'));
    await page.fill('#igd-input', 'explain this board to me in two lines'); await page.click('#igd-go');   /* typed: the brain's */
    /* RE-POINTED 26 Oct 2026: the answer stands under his tab; his greeting waits under Overview, one press back */
    const A2 = await until(() => { const d = document.getElementById('ig-dock'); return !intel.busy && d && /Two things want you this week/.test(d.innerText) ? true : null; }, null, 10000);
    const A2h = await panelHead('#ig-dock');
    check('A2 a question on the Board: the answer in his conversation, his name alone above it, "‹ Overview" above the box', !!A2 && A2h.tabs.length === 1 && /Jambo/.test(A2h.tabs[0]) && /Overview|Översikt/.test(A2h.door) && A2h.word.length === 0, JSON.stringify(A2h));
    for (const [w, hh] of SCREENS){ await page.setViewportSize({ width: w, height: hh }); await page.waitForTimeout(350); await page.screenshot({ path: path.join(OUT, `A-board-${w}x${hh}.png`) }); }
    await page.setViewportSize({ width: 1440, height: 780 });

    await homeFace('explorer');
    await until(() => !!document.getElementById('igd-input') && document.querySelector('#ig-dock [data-pd-tab="findings"]'));
    const A3 = await panelHead('#ig-dock');
    /* RE-POINTED 26 Oct 2026 (owner: "we will have an overview tab side panel in each page followed by the jambo tab", answered "Yes, every page"; REVERSES the one window here): Overview first, then Jambo, then the page's own tabs; still no word */
    check('A3 Explorer: Overview, then its own Findings · Guide, no Jambo tab, no word', !!A3 && /Overview/.test(A3.tabs[0]) && noJb(A3) && A3.tabs.some(t => /Findings/.test(t)) && A3.word.length === 0, JSON.stringify(A3));

    await page.evaluate(() => setView('register'));
    await until(() => !window.pdSolo() && !!document.getElementById('igd-input'));
    const A4 = await panelHead('#ig-dock');
    /* THE CONTRACTS PLACE KEEPS TWO TABS (owner, 26 Oct 2026, REVERSING "no
       tabs" of 24 Oct: "image 2 in the contracts page … has information on the
       side panel like discovery and other that is important to always be in
       view therefore it warrants a second panel for jambo"). Its panel carries
       the wall and Discover — the page's own work, not his words — so it wears
       the Dossier's pattern: the page's tab and his, one press apart. */
    check('A4 the Contracts place: the page\'s own tab alone, so Discover is never inside the talk',
      !!A4 && A4.tabs.length === 1 && A4.tabs.some(t => /Overview|Översikt/.test(t)) && A4.word.length === 0, JSON.stringify(A4));

    await page.evaluate(() => setView('intake'));
    await until(() => !!document.querySelector('#ins-panel .jl-body [data-jl-words] .jov'));
    const A5 = await panelHead('#ins-panel');
    /* RE-POINTED 26 Oct 2026 (owner: "we will have an overview tab side panel in each page followed by the jambo tab", answered "Yes, every page"; REVERSES the one window here): Overview first, then Jambo, then the page's own tabs; still no word */
    check('A5 Requests, nothing chosen: its Overview, no Jambo tab, no word', !!A5 && /Overview/.test(A5.tabs[0]) && noJb(A5) && A5.word.length === 0, JSON.stringify(A5));
    ai.reset(); ai.script(deliver('Nothing is open, so nothing waits.'));
    await page.evaluate(() => { const q = document.getElementById('jl-q'); q.value = 'explain this page to me in two lines'; q.closest('form').requestSubmit(); });
    const A6 = await until(() => { const p = document.getElementById('ins-panel'); return p && /Nothing is open, so nothing waits/.test(p.innerText) && p.classList.contains('is-talk') ? true : null; }, null, 10000);
    const A6h = await panelHead('#ins-panel');
    check('A6 a question there: answered in his conversation, "‹ Overview" above the box', !!A6 && A6h.tabs.length === 1 && /Jambo/.test(A6h.tabs[0]) && /Overview/.test(A6h.door), JSON.stringify(A6h));

    await page.evaluate(() => setView('team'));
    await until(() => !!document.getElementById('st-jb-feed'));
    const A7 = await panelHead('#st-side');
    /* REVERSED (owner, 26 Oct 2026, of every page): Settings' landing carries
       "N things need you here" with a link per row, so it keeps its own tab
       beside his rather than being his one window. A7 now reads the rule's
       other half too — the reading is of what the landing HOLDS. */
    check('A7 Settings: its own Overview, no Jambo tab',
      !!A7 && A7.tabs.length === 1 && A7.tabs.some(t => /Overview|Översikt/.test(t)), JSON.stringify(A7));

    await page.evaluate(() => setView('calendar'));
    await until(() => !!document.getElementById('cal-plan'));
    const A8 = await panelHead('#cal-plan');
    /* RE-POINTED 26 Oct 2026 (owner: a first page with a link to press needs a second tab for Jambo): Your week
       carries the planner's asks and its setting, so Overview and Jambo, still no page word */
    check('A8 the Calendar: Your week under Overview, no Jambo tab, no word', !!A8 && A8.tabs.length === 1 && A8.tabs.some(t => /Overview|Översikt/.test(t)) && A8.word.length === 0, JSON.stringify(A8));

    await page.evaluate(() => pdOpenOnHome('MK-B2', 'copilot'));
    await until(() => !!document.querySelector('#ig-dock [data-pd-tab="red"]'));
    const A9 = await panelHead('#ig-dock');
    check('A9 a contract\'s Dossier keeps its tabs (information)', !!A9 && A9.tabs.some(t => /Dossier/.test(t)) && noJb(A9), JSON.stringify(A9));

    await page.evaluate(() => setView('playbook'));
    await until(() => !!document.querySelector('#ins-panel [data-jl-home]'));
    const A10 = await panelHead('#ins-panel');
    check('A10 Our standards, a standard chosen, keeps Overview, no Jambo tab', !!A10 && A10.tabs.some(t => /Overview/.test(t)) && noJb(A10), JSON.stringify(A10));

    /* THE RULE OF 26 OCT 2026 — that a page's own work is never inside the
       conversation — has its own home: test/chromium/jambo-panel-sweep-verify.js
       walks every page with a panel and holds each to it. It is not repeated
       here in a weaker form; this file is about what each panel's head draws. */

    console.log('\nB · the top bar, The SAP way');
    /* the ink is laid over the bar first (the quiet ink is 78% white), then measured */
    const contrast = (ink, bg) => { const n = c => c.match(/\d+(\.\d+)?/g).map(Number);
      const b = n(bg).slice(0, 3), i = n(ink), a = i.length > 3 ? i[3] : 1, mix = i.slice(0, 3).map((x, k) => x * a + b[k] * (1 - a));
      const L = v => { const w = v.map(x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * w[0] + 0.7152 * w[1] + 0.0722 * w[2]; };
      const [x, y] = [L(mix), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    for (const v of ['counter', 'intake', 'team']){
      await page.evaluate(x => setView(x), v); await page.waitForTimeout(600);
      const B = await page.evaluate(() => { const hd = document.getElementById('top-header'); const bg = getComputedStyle(hd).backgroundColor;
        const inks = ['.dk-mark', '#dk-page', '#cmd-ai', '#hdr-notify'].map(s => document.querySelector('#top-header ' + s)).filter(Boolean).map(el => getComputedStyle(el).color);
        return { bg, inks }; });
      const worst = Math.min(...B.inks.map(c => contrast(c, B.bg)));
      check(`B1 ${v}: the bar is the deep green and every word and icon in it reads (≥ 4.5:1)`, B.bg === 'rgb(11, 59, 54)' && B.inks.length >= 3 && worst >= 4.5, JSON.stringify(B) + ' · worst ' + worst.toFixed(1));
    }
    await page.click('#dk-page');
    const B2 = await until(() => { const m = document.getElementById('dk-recent'); return m && m.getClientRects().length ? getComputedStyle(m).backgroundColor : null; }, null, 4000);
    check('B2 the Recent menu that opens from the bar is a white card', B2 === 'rgb(255, 255, 255)', String(B2));
    await page.keyboard.press('Escape');

    console.log('\nC · Jambo\'s cards, The Legora way');
    await page.evaluate(() => setView('team')); await until(() => !!document.getElementById('st-jb-feed'));
    await page.evaluate(() => stJbAsk('turn off my suggestions'));
    const C1 = await until(() => { const c = document.querySelector('#st-side .st-jb-card'); if (!c) return null; const f = c.querySelector('.st-jb-fine'); const cs = getComputedStyle(c);
      const r = c.getBoundingClientRect(), fr = f ? f.getBoundingClientRect() : null;
      return { bg: cs.backgroundColor, border: cs.borderTopWidth, radius: cs.borderTopLeftRadius, fineIn: fr ? Math.round(fr.left - r.left + parseFloat(getComputedStyle(f).paddingLeft)) : null, fineBottom: fr ? Math.round(r.bottom - fr.bottom) : null }; });
    check('C1 a Settings card: one soft grey, no edge, 18px round', !!C1 && C1.bg === 'rgb(242, 242, 245)' && C1.border === '0px' && C1.radius === '18px', JSON.stringify(C1));
    check('C2 "Found without AI · free" sits inside the card, never at its edge', !!C1 && C1.fineIn >= 12 && C1.fineBottom >= 0, JSON.stringify(C1));
    /* the same card in the ✦ window (.jb-turn), where the footnote had no spacing */
    await page.evaluate(() => { if (!(ai.open && ai.win)) openAI(null, { win: true }); });
    await page.waitForTimeout(400);
    await page.evaluate(() => { try { renderAIFeed(false); } catch (_) {} });
    const C3ok = await until(() => !!document.querySelector('#ai-feed .st-jb-card .st-jb-fine'));
    check('C3a the card is drawn in the ✦ window', !!C3ok);
    const C3 = await page.evaluate(() => { const c = document.querySelector('#ai-feed .st-jb-card'); const f = c.querySelector('.st-jb-fine');
      const r = c.getBoundingClientRect(), fr = f.getBoundingClientRect(); const pl = parseFloat(getComputedStyle(f).paddingLeft);
      const rd = c.closest('.jb-turn, .ai-msg, [data-st-jb-turn]'); const from = rd && [...rd.parentElement.querySelectorAll('.jb-read, .ai-read, [data-jb-read]')].find(x => x.getBoundingClientRect().top >= r.top);
      return { bg: getComputedStyle(c).backgroundColor, fineIn: Math.round(fr.left - r.left + pl), readBelow: from ? Math.round(from.getBoundingClientRect().top - r.bottom) : null }; });
    check('C3 in the ✦ window the same card and its footnote 12px+ inside', C3.bg === 'rgb(242, 242, 245)' && C3.fineIn >= 12, JSON.stringify(C3));
    await page.evaluate(() => { if (window.aiWinToggle && ai.open) try { aiWinToggle(); } catch (_) {} });
    await homeFace('board'); await until(() => !!document.getElementById('igd-input'));
    await page.evaluate(() => intelAsk('help'));
    const C4 = await until(() => { const c = document.querySelector('#ig-dock .ca-card'); if (!c) return null; const cs = getComputedStyle(c); return { bg: cs.backgroundColor, border: cs.borderTopWidth, radius: cs.borderTopLeftRadius, pad: cs.paddingLeft }; });
    check('C4 his own card (Words I know): the same grey, no edge, 18px round, 16px inside', !!C4 && C4.bg === 'rgb(242, 242, 245)' && C4.border === '0px' && C4.radius === '18px' && C4.pad === '16px', JSON.stringify(C4));
    for (const [w, hh] of SCREENS){ await page.setViewportSize({ width: w, height: hh }); await page.waitForTimeout(350); await page.screenshot({ path: path.join(OUT, `C-cards-${w}x${hh}.png`) }); }

    check('D no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    check('the run stopped', false, String(e && e.message || e).slice(0, 200));
  } finally {
    await browser.close(); await h.stop(); await ai.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
