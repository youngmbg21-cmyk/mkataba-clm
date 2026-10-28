/* JAMBO AS A TAB YOU FLIP TO, AND BACK (owner, 19 Oct 2026: "when you jump
   on a page they should be as is, with the panel on the right and an entry
   field for Jambo at the bottom. When you type on the entry field … it takes
   you to a different right side jambo panel on the same page … You then
   simply click back to go back to where the field of information that was on
   the right side panel. Let's say the redline cards.")

   WHAT THIS PINS, driven in a real browser as the admin:
     1 WORKSPACE, beside a contract with their redlines: the first tab says
       "Overview"; the Redlines face's back says "‹ Overview"; typing in the
       box turns the panel to the conversation — the trail "‹ Redlines
       Redlines / Jambo", the cards out of sight, the question said; ‹ Redlines
       returns to the same cards at the same scroll; asked again, the same
       conversation; Esc and the bar's ‹ return too
       — and two tabs later its Jambo tab opens the same conversation (1m)
     2 A NEW CONTRACT IS FRESH: another contract on Home lands on its own panel,
       no conversation in front
     3 A "GO TO" ASK TAKES YOU THERE: "open explorer" typed beside a paper
       moves to Explorer, which lands on its own panel
     4 A LIST PAGE: a row held, a question turns the panel to the
       conversation ("‹ Overview  Overview / Jambo"), the row still held;
       the back returns
     5 SETTINGS: a question turns the panel; the back returns to its words
     6 THE WAY BACK TO THE CONVERSATION (owner picked "A Jambo tab", 19 Oct
       2026): once words were said on a page, a "Jambo" tab stands beside
       Overview (none before); pressed it opens the conversation as it was,
       pressed again it goes back — on Home's panel (1j–1l), a list panel
       (4d–4f), Settings (5d–5f) and the Calendar (6a–6c). Red at the parent:
       no such tab anywhere.
   RE-POINTED 28 Oct 2026 (owner picked "Door above the box"; reverses 6): there is NO Jambo tab — while the
   conversation shows, his name alone heads the panel and the one way back is "‹ <landing>" right above the box
   (data-jb-door); asking again brings the same conversation back. The claims below read that door.
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/jambo-tab-and-back-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  await H.seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.setDefaultTimeout(6000);
    const part = async (name, fn) => { try { await fn(); } catch (e) { check(name + ': the part ran', false, String((e && e.message) || e).split('\n')[0]); } };
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-A2'), null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    /* their redlines on two contracts: the Redlines face has cards */
    await page.evaluate(async () => {
      for (const id of ['MK-A2', 'MK-B2']) { const c = getContract(id); if (!c) continue; if (c._light) await ensureFull(c); negoInit(c);
        const cl = negoClauseList(c);
        for (let i = 0; i < Math.min(cl.length, 6); i++)
          await negoEditClause(c, cl[i].clauseId, '<p>Their wording for clause ' + (i + 1) + ', changed at length so the card has words to show.</p>', { side: 'counterparty', author: 'Erik Lindqvist', summary: 'Ask ' + (i + 1) });
        persist(c); }
      if (window.flushSaves) await flushSaves();
    });
    const DOCK = () => { const d = document.getElementById('ig-dock'); if (!d) return null;
      const tr = d.querySelector(':scope > .pd-trail');
      const door = [...d.querySelectorAll('[data-jb-door]')].find(x => x.getClientRects().length);
      return { talk: d.classList.contains('is-talk'), tab: ((d.querySelector('[data-pd-tab="copilot"] .pd-tab-w') || {}).textContent || '').trim(),
        back: tr ? ((tr.querySelector('.pd-back') || {}).textContent || '').trim() : null, path: tr ? ((tr.querySelector('.pd-trail-w') || {}).textContent || '').replace(/\s+/g, ' ').trim() : null,
        door: door ? ((door.querySelector('.jb-door-back') || {}).textContent || '').trim() : null, head: ((d.querySelector('.igd-head .jb-talk-label .pd-tab-w') || {}).textContent || '').trim(),
        tabs: [...d.querySelectorAll('.igd-head .pd-tab')].filter(x => x.getClientRects().length).length,
        cards: document.querySelectorAll('#pd-redface [data-nego-card]').length,
        top: (document.querySelector('#pd-redface #nego-cards') || {}).scrollTop || 0,
        asked: [...d.querySelectorAll('#igd-feed .ai-msg')].map(m => m.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean) }; };
    const ask = async (sel, words) => { await page.click(sel); await page.fill(sel, words); await page.keyboard.press('Enter'); };
    /* HIS ANSWER LANDS BEFORE THE NEXT PRESS (made steady 25 Oct 2026): an answer still on its way turns the panel
       back to the conversation when it lands (pdTalkSync), so with four checks side by side a ‹ pressed mid-answer
       read as "did not go back". Each press that leaves the talk waits for the answer first, bounded. */
    const answered = () => until(() => (typeof intel === 'object' && intel && !intel.busy) ? true : null, null, 15000);

    /* ---- 1 Workspace, beside a contract ---- */
    let keptTop = 0, firstSaid = 0;
    await part('1', async () => {
      const t0 = await page.evaluate(() => Date.now());
      await page.evaluate(() => openRedlineWorkbench('MK-A2'));
      await until(() => document.querySelectorAll('#pd-redface [data-nego-card]').length >= 2, null, 12000);
      /* THE PAGE IS NOTED BEFORE THE FIRST WORD (made steady 25 Oct 2026): the bar notes the page arrived on, and the
         face it came with, once the page has settled (DK_SETTLE_MS after its last repaint) — so ‹ knows a face opened
         here from one that came with the page. A question typed before that note (no person types so fast; four
         checks side by side delay the note) made the talk read as the face the page came with, and ‹ left the page.
         Asked of the bar's own record, bounded. */
      await until(t => { try { const all = JSON.parse(localStorage.getItem('hati.v1.deskTabs') || '{}'), k = deskKeyNow();
        return Object.values(all).some(L => Array.isArray(L) && L.some(x => x && x.k === k && (x.at || 0) >= t)) || null; } catch (_){ return null; } }, t0, 8000);
      const D0 = await page.evaluate(DOCK);
      /* RE-POINTED 20 Oct 2026 (owner picked "The Dossier"): beside a contract the first tab is its Dossier; the lists keep Overview */
      check('1a beside a contract the first tab says "Dossier"', !!D0 && D0.tab === 'Dossier', JSON.stringify(D0 && D0.tab));
      check('1b the Redlines face\'s back says "‹ Dossier"', !!D0 && D0.back === 'Dossier' && /Dossier \/ Redlines/.test(D0.path || ''), JSON.stringify(D0 && { back: D0.back, path: D0.path }));
      check('1c the page lands as it is: the cards, no conversation', !!D0 && !D0.talk && D0.cards >= 2, JSON.stringify(D0 && { talk: D0.talk, cards: D0.cards }));
      keptTop = await page.evaluate(() => { const sc = document.querySelector('#pd-redface #nego-cards'); if (!sc) return -1;
        sc.scrollTop = Math.min(120, Math.max(0, sc.scrollHeight - sc.clientHeight)); return sc.scrollTop; });
      await ask('#igd-input', 'what should I watch for in these redlines?');
      const D1 = await until(() => { const d = document.getElementById('ig-dock'); return d && d.classList.contains('is-talk') && document.querySelector('#ig-dock [data-jb-door]:not([hidden])') ? true : null; }, null, 10000)
        ? await page.evaluate(DOCK) : await page.evaluate(DOCK);
      check('1d typing turns the panel to the conversation: "Jambo" alone heads it, "‹ Redlines" above the box, no trail line', !!D1 && D1.talk && D1.door === 'Redlines' && D1.head === 'Jambo' && D1.tabs === 1 && D1.back === null, JSON.stringify(D1 && { talk: D1.talk, door: D1.door, head: D1.head, tabs: D1.tabs, back: D1.back }));
      check('1e the cards are out of sight; the question is said', !!D1 && D1.cards === 0 && D1.asked.some(t => /watch for/.test(t)), JSON.stringify(D1 && { cards: D1.cards, asked: D1.asked.length }));
      firstSaid = D1 ? D1.asked.length : 0;
      await answered();
      await page.click('#ig-dock [data-jb-door] .jb-door-back');
      await until(() => document.querySelectorAll('#pd-redface [data-nego-card]').length >= 2 && !document.getElementById('ig-dock').classList.contains('is-talk'), null, 8000);
      await page.waitForTimeout(250);
      const D2 = await page.evaluate(DOCK);
      check('1f ‹ Redlines returns to the same cards at the same scroll', !!D2 && !D2.talk && D2.cards === D0.cards && Math.abs(D2.top - keptTop) <= 2,
        JSON.stringify(D2 && { talk: D2.talk, cards: D2.cards, top: D2.top, kept: keptTop }));
      /* NO JAMBO TAB (Door above the box, 28 Oct 2026): the landing draws none, and no door */
      const noTab = await page.evaluate(() => !document.querySelector('#ig-dock .igd-head .pd-tab-talk') && ![...document.querySelectorAll('#ig-dock [data-jb-door]')].some(x => x.getClientRects().length));
      check('1j back on the cards: no Jambo tab, no door', noTab);
      await ask('#igd-input', 'and the payment terms?');
      await until(() => document.getElementById('ig-dock').classList.contains('is-talk') && document.querySelectorAll('#igd-feed .ai-msg').length > 2, null, 10000);
      await answered();
      const D3 = await page.evaluate(DOCK);
      check('1g asked again on the same page: the same conversation comes back and goes on', !!D3 && D3.talk && D3.asked.length > firstSaid && D3.asked.some(t => /watch for/.test(t)), JSON.stringify(D3 && { asked: D3.asked.length, before: firstSaid }));
      const face = await page.evaluate(() => ({ mark: !!document.querySelector('#ig-dock .igd-head .jb-talk-label svg.jambo-mark, #ig-dock .igd-head .jb-talk-label .jambo-face') }));
      check('1j2 his face (the ✦ mark on a computer) rides his name over the conversation', face.mark, JSON.stringify(face));
      await page.evaluate(() => { if (document.activeElement) document.activeElement.blur(); });
      await page.keyboard.press('Escape');
      const esc = await until(() => !document.getElementById('ig-dock').classList.contains('is-talk') && document.querySelectorAll('#pd-redface [data-nego-card]').length >= 2, null, 5000);
      check('1h Esc (outside the box) returns to the landing', !!esc);
      await ask('#igd-input', 'one more question');
      await until(() => document.getElementById('ig-dock').classList.contains('is-talk'), null, 8000);
      await answered();
      const bar = await page.$('#dk-back');
      if (bar) await bar.click();
      const viaBar = await until(() => !document.getElementById('ig-dock').classList.contains('is-talk') && document.querySelectorAll('#pd-redface [data-nego-card]').length >= 2, null, 5000);
      check('1i the bar\'s ‹ returns to the landing too', !!bar && !!viaBar);
      /* THE CONVERSATION IS THE CONTRACT'S, NOT THE TAB'S (owner, 20 Oct
         2026: "jambo panel seems to lose the chat history when i am moving
         between tabs"): another tab of the same contract, then the Jambo tab,
         brings back every word said beside it. Red at the parent: empty. */
      for (const t of ['oblig', 'menu']){
        const sel = '#ig-dock [data-pd-tab="' + t + '"]';
        if (await page.$(sel)) await page.click(sel);
        await until(sel => { const b = document.querySelector(sel); return b && b.classList.contains('on'); }, sel, 5000);
      }
      await ask('#igd-input', 'and the notice period?');
      const J3 = await until(() => document.getElementById('ig-dock').classList.contains('is-talk') ? [...document.querySelectorAll('#igd-feed .ai-msg')].map(m => m.textContent).join(' ') : null, null, 5000);
      check('1m two tabs later, asking again opens the same conversation', !!J3 && /watch for/.test(J3) && /payment terms/.test(J3) && /one more question/.test(J3), JSON.stringify(J3 && J3.slice(0, 160)));
    });

    /* ---- 2 another contract: the one conversation (RE-POINTED 21 Oct 2026, owner: "Jambo keeps ONE conversation across the whole app"; reverses "another contract is fresh") ---- */
    await part('2', async () => {
      await page.evaluate(() => openRedlineWorkbench('MK-B2'));
      await until(() => document.querySelector('#pd-redface') && window.intel && intel.paper && intel.paper.id === 'MK-B2', null, 12000);
      await page.waitForTimeout(300);
      const D = await page.evaluate(DOCK);
      check('2a another contract lands on its own panel, no conversation in front', !!D && !D.talk, JSON.stringify(D && { talk: D.talk, asked: D.asked.length }));
      await ask('#igd-input', 'is anything late here?');
      await until(() => document.getElementById('ig-dock').classList.contains('is-talk'), null, 8000);
      const E = await page.evaluate(DOCK);
      check('2b its conversation is the one conversation: what was said beside MK-A2 is here too, with the new question', !!E && E.talk && E.asked.some(t => /watch for|payment terms/.test(t)) && E.asked.some(t => /late here/.test(t)),
        JSON.stringify(E && E.asked.slice(0, 4)));
    });

    /* ---- 3 a "go to" ask takes you there ---- */
    await part('3', async () => {
      /* WAIT FOR 2b's ANSWER (22 Oct 2026): on GitHub's slower machine the last
         question was still being answered, and words asked while Jambo is busy
         are not taken (intelAsk) — "open explorer" went nowhere. Bounded. */
      await until(() => !(window.intel && intel.busy) ? true : null, null, 15000);
      await page.evaluate(() => { const b = document.querySelector('#ig-dock [data-jb-door] .jb-door-back'); if (b && document.getElementById('ig-dock').classList.contains('is-talk')) b.click(); });
      /* RE-POINTED 28 Oct 2026 ("Door above the box"): a page's one name moves free; the long form is the brain's */
      await ask('#igd-input', 'explorer');
      const moved = await until(() => window.state && state.view === 'dashboard' && typeof hbFace === 'function' && hbFace() === 'explorer' ? true : null, null, 8000);
      await page.waitForTimeout(300);
      const D = await page.evaluate(DOCK);
      check('3a "explorer" moves to Explorer, which lands on its own panel', !!moved && !!D && !D.talk, JSON.stringify({ moved: !!moved, talk: D && D.talk, face: await page.evaluate(() => typeof hbFace === 'function' ? hbFace() : null) }));
    });

    /* ---- 4 a list page ---- */
    await part('4', async () => {
      await page.evaluate(() => openNegotiations({ list: true }));
      await until(() => document.querySelectorAll('#reg-tbody tr[data-row]').length >= 1 && document.querySelector('#ins-panel.is-jambo .jl-body'), null, 10000);
      await page.click('#reg-tbody tr[data-row]');
      await until(() => document.getElementById('ins-panel').getAttribute('data-ins-id'), null, 5000);
      const L0 = await page.evaluate(() => { const p = document.getElementById('ins-panel'); return { id: p.getAttribute('data-ins-id'), tab: (p.querySelector('[data-jl-home] .pd-tab-w') || {}).textContent,
        talk: !p.querySelector('.jl-talk').hidden }; });
      check('4a the list panel lands on the row\'s panel, its tab "Overview"', !!L0 && !L0.talk && L0.tab === 'Overview', JSON.stringify(L0));
      await ask('#jl-q', 'why has this not moved?');
      await until(() => { const p = document.getElementById('ins-panel'); return p && !p.querySelector('.jl-talk').hidden; }, null, 8000);
      const L1 = await page.evaluate(() => { const p = document.getElementById('ins-panel'); const d = p.querySelector('.jl-foot [data-jb-door]');
        const lab = p.querySelector('.jl-head .jb-talk-label');
        return { id: p.getAttribute('data-ins-id'), body: !p.querySelector('.jl-body').hidden, back: d && !d.hidden ? d.querySelector('.jb-door-back').textContent.trim() : null,
          head: lab && !lab.hidden ? lab.textContent.replace(/[^\p{L} ]/gu, '').trim() : null, window: !!(window.ai && ai.open) }; });
      check('4b a question turns the panel: "Jambo" heads it, "‹ Overview" above the box, the row still held, the window shut', !!L1 && !L1.body && L1.back === 'Overview' && L1.head === 'Jambo' && L1.id === L0.id && !L1.window, JSON.stringify(L1));
      await page.click('#ins-panel .jl-foot [data-jb-door] .jb-door-back');
      const L2 = await until(() => { const p = document.getElementById('ins-panel'); return p && !p.querySelector('.jl-body').hidden && p.querySelector('.jl-talk').hidden ? p.getAttribute('data-ins-id') : null; }, null, 5000);
      check('4c ‹ Overview returns to the row\'s panel as left', L2 === L0.id, JSON.stringify({ was: L0.id, now: L2 }));
      const lt = () => { const t = document.querySelector('#ins-panel [data-jl-talk]'); const d = document.querySelector('#ins-panel [data-jb-door]'); return !!t && t.hidden && !!d && d.hidden; };
      check('4d back on the row\'s panel: no Jambo tab, no door', await page.evaluate(lt));
      await ask('#jl-q', 'and who is it waiting on?');
      const L3 = await until(() => { const p = document.getElementById('ins-panel'); return p && !p.querySelector('.jl-talk').hidden && /not moved/.test(p.querySelector('.jl-talk').textContent); }, null, 5000);
      check('4e asked again, the conversation comes back, the first question in it', !!L3);
      await until(() => !(window.ai && ai.busy) ? true : null, null, 15000);
      await page.click('#ins-panel .jl-foot [data-jb-door] .jb-door-back');
      const L4 = await until(() => { const p = document.getElementById('ins-panel'); return p && p.querySelector('.jl-talk').hidden && !p.querySelector('.jl-body').hidden; }, null, 5000);
      check('4f the door again, back to the row\'s panel', !!L4);
    });

    /* ---- 5 Settings — REVERSED (owner, 26 Oct 2026, of every page: "if a link
       is on the first page and a user will need to access it, they should not
       scroll up the jambo to find this link"). Settings' landing carries "N
       things need you here" with a link per row, so the page keeps its own tab
       beside his: a question goes to HIS view, the page's stands aside, and the
       trail names the way back. What decides is what the landing HOLDS. ---- */
    await part('5', async () => {
      await page.evaluate(() => setView('team'));
      await until(() => document.getElementById('st-jb-q') && document.querySelector('#st-jb-feed > *'), null, 8000);
      const S0 = await page.evaluate(() => ({ door: !document.querySelector('#st-jb-form [data-jb-door]').hidden, tabs: [...document.querySelectorAll('#st-side-head .st-side-tab')].filter(x => !x.hidden).length }));
      check('5a Settings shows Overview alone, no door until the talk is up', !S0.door && S0.tabs === 1, JSON.stringify(S0));
      await ask('#st-jb-q', 'what is a sealed PDF?');
      const S1 = await until(() => { const T = document.querySelector('#st-jb-feed [data-st-jb-talk]'), L = document.querySelector('#st-jb-feed [data-st-jb-land]');
        return T && !T.hidden && /sealed PDF/.test(T.textContent) ? { land: !!L && !L.hidden, door: !document.querySelector('#st-jb-form [data-jb-door]').hidden } : null; }, null, 6000);
      check('5b a question goes to his view, the page\'s stands aside, the door above the box names the way back', !!S1 && !S1.land && S1.door, JSON.stringify(S1));
    });

    /* ---- 6 the Calendar — RE-POINTED 26 Oct 2026 (owner: "any page where there is a link to press on the first page
       needs a second tab for jambo"; reverses the 24 Oct one window): Your week under Overview, the talk under Jambo ---- */
    await part('6', async () => {
      await page.evaluate(() => hbOpenCalendar());
      await until(() => document.getElementById('cal-plan-in'), null, 8000);
      const C0 = await page.evaluate(() => ({ tabs: document.querySelectorAll('#cal-plan .pd-tab').length, door: !!document.querySelector('#cal-plan [data-jb-door]') }));
      check('6a the Calendar shows Overview alone, no door until the talk is up', C0.tabs === 1 && !C0.door, JSON.stringify(C0));
      await ask('#cal-plan-in', 'what is due this week?');
      const C1 = await until(() => { const c = document.getElementById('cal-plan'), t = document.getElementById('cal-plan-talk'), w = c && c.querySelector('.cal-yw');
        return t && /due this week/.test(t.textContent) && t.getClientRects().length && !(w && w.getClientRects().length) && !!c.querySelector('[data-jb-door]') ? true : null; }, null, 8000);
      check('6b the question and its answer stand in his conversation, Your week aside, the door above the box names the way back', !!C1);
      await page.evaluate(() => { const b = document.querySelector('#cal-plan [data-cal-talk-back]'); if (b) b.click(); });
      const C2 = await until(() => { const c = document.getElementById('cal-plan'), w = c && c.querySelector('.cal-yw');
        return w && w.getClientRects().length && w.querySelector('[data-cal-plan-q="week"]') ? true : null; }, null, 6000);
      check('6c ‹ Overview brings Your week back with its asks', !!C2);
    });
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
