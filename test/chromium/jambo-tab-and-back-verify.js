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
      return { talk: d.classList.contains('is-talk'), tab: ((d.querySelector('[data-pd-tab="copilot"] .pd-tab-w') || {}).textContent || '').trim(),
        back: tr ? ((tr.querySelector('.pd-back') || {}).textContent || '').trim() : null, path: tr ? ((tr.querySelector('.pd-trail-w') || {}).textContent || '').replace(/\s+/g, ' ').trim() : null,
        cards: document.querySelectorAll('#pd-redface [data-nego-card]').length,
        top: (document.querySelector('#pd-redface #nego-cards') || {}).scrollTop || 0,
        asked: [...d.querySelectorAll('#igd-feed .ai-msg')].map(m => m.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean) }; };
    const ask = async (sel, words) => { await page.click(sel); await page.fill(sel, words); await page.keyboard.press('Enter'); };

    /* ---- 1 Workspace, beside a contract ---- */
    let keptTop = 0, firstSaid = 0;
    await part('1', async () => {
      await page.evaluate(() => openRedlineWorkbench('MK-A2'));
      await until(() => document.querySelectorAll('#pd-redface [data-nego-card]').length >= 2, null, 12000);
      const D0 = await page.evaluate(DOCK);
      /* RE-POINTED 20 Oct 2026 (owner picked "The Dossier"): beside a contract the first tab is its Dossier; the lists keep Overview */
      check('1a beside a contract the first tab says "Dossier"', !!D0 && D0.tab === 'Dossier', JSON.stringify(D0 && D0.tab));
      check('1b the Redlines face\'s back says "‹ Dossier"', !!D0 && D0.back === 'Dossier' && /Dossier \/ Redlines/.test(D0.path || ''), JSON.stringify(D0 && { back: D0.back, path: D0.path }));
      check('1c the page lands as it is: the cards, no conversation', !!D0 && !D0.talk && D0.cards >= 2, JSON.stringify(D0 && { talk: D0.talk, cards: D0.cards }));
      keptTop = await page.evaluate(() => { const sc = document.querySelector('#pd-redface #nego-cards'); if (!sc) return -1;
        sc.scrollTop = Math.min(120, Math.max(0, sc.scrollHeight - sc.clientHeight)); return sc.scrollTop; });
      await ask('#igd-input', 'what should I watch for in these redlines?');
      const D1 = await until(() => { const d = document.getElementById('ig-dock'); return d && d.classList.contains('is-talk') && document.querySelector('#ig-dock > .pd-trail') ? true : null; }, null, 10000)
        ? await page.evaluate(DOCK) : await page.evaluate(DOCK);
      check('1d typing turns the panel to the conversation: "‹ Redlines  Redlines / Jambo"', !!D1 && D1.talk && D1.back === 'Redlines' && D1.path === 'Redlines / Jambo', JSON.stringify(D1 && { talk: D1.talk, back: D1.back, path: D1.path }));
      check('1e the cards are out of sight; the question is said', !!D1 && D1.cards === 0 && D1.asked.some(t => /watch for/.test(t)), JSON.stringify(D1 && { cards: D1.cards, asked: D1.asked.length }));
      firstSaid = D1 ? D1.asked.length : 0;
      await page.click('#ig-dock > .pd-trail .pd-back');
      await until(() => document.querySelectorAll('#pd-redface [data-nego-card]').length >= 2 && !document.getElementById('ig-dock').classList.contains('is-talk'), null, 8000);
      await page.waitForTimeout(250);
      const D2 = await page.evaluate(DOCK);
      check('1f ‹ Redlines returns to the same cards at the same scroll', !!D2 && !D2.talk && D2.cards === D0.cards && Math.abs(D2.top - keptTop) <= 2,
        JSON.stringify(D2 && { talk: D2.talk, cards: D2.cards, top: D2.top, kept: keptTop }));
      /* THE JAMBO TAB: none before a word was said here, there once one was */
      const tabUp = () => { const t = document.querySelector('#ig-dock [data-pd-talk]'); return !!t && t.getClientRects().length > 0; };
      check('1j after ‹ Redlines a "Jambo" tab stands beside Overview', await page.evaluate(tabUp));
      /* RE-POINTED 21 Oct 2026 (Chambers, owner's pick 20 Oct 2026): on a
         computer his face is the ✦ mark (an svg .jambo-face), the bird only
         on the phone — asked of the face, whatever it is drawn as */
      const faces = await page.evaluate(() => ({ jb: !!document.querySelector('#ig-dock [data-pd-talk] .jambo-face'), ov: !!document.querySelector('#ig-dock [data-pd-tab="copilot"] .jambo-face'),
        mark: !!document.querySelector('#ig-dock [data-pd-talk] svg.jambo-mark') }));
      check('1j2 his face (the ✦ mark on a computer) rides the Jambo tab, never Overview', faces.jb && faces.mark && !faces.ov, JSON.stringify(faces));
      if (await page.evaluate(tabUp)) await page.click('#ig-dock [data-pd-talk]');
      const J1 = await until(() => document.getElementById('ig-dock').classList.contains('is-talk') ? [...document.querySelectorAll('#igd-feed .ai-msg')].map(m => m.textContent).join(' ') : null, null, 5000);
      check('1k pressed, it opens the conversation as it was, without typing', !!J1 && /watch for/.test(J1));
      if (await page.evaluate(tabUp)) await page.click('#ig-dock [data-pd-talk]');
      const J2 = await until(() => !document.getElementById('ig-dock').classList.contains('is-talk') && document.querySelectorAll('#pd-redface [data-nego-card]').length >= 2, null, 5000);
      check('1l pressed again, it goes back to the cards', !!J2);
      await ask('#igd-input', 'and the payment terms?');
      await until(() => document.getElementById('ig-dock').classList.contains('is-talk') && document.querySelectorAll('#igd-feed .ai-msg').length > 2, null, 10000);
      const D3 = await page.evaluate(DOCK);
      check('1g asked again on the same page: the same conversation goes on', !!D3 && D3.talk && D3.asked.length > firstSaid && D3.asked.some(t => /watch for/.test(t)), JSON.stringify(D3 && { asked: D3.asked.length, before: firstSaid }));
      await page.evaluate(() => { if (document.activeElement) document.activeElement.blur(); });
      await page.keyboard.press('Escape');
      const esc = await until(() => !document.getElementById('ig-dock').classList.contains('is-talk') && document.querySelectorAll('#pd-redface [data-nego-card]').length >= 2, null, 5000);
      check('1h Esc (outside the box) returns to the landing', !!esc);
      await ask('#igd-input', 'one more question');
      await until(() => document.getElementById('ig-dock').classList.contains('is-talk'), null, 8000);
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
      if (await page.evaluate(tabUp)) await page.click('#ig-dock [data-pd-talk]');
      const J3 = await until(() => document.getElementById('ig-dock').classList.contains('is-talk') ? [...document.querySelectorAll('#igd-feed .ai-msg')].map(m => m.textContent).join(' ') : null, null, 5000);
      check('1m two tabs later, the Jambo tab opens the same conversation', !!J3 && /watch for/.test(J3) && /payment terms/.test(J3) && /one more question/.test(J3), JSON.stringify(J3 && J3.slice(0, 160)));
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
      await page.evaluate(() => { const b = document.querySelector('#ig-dock > .pd-trail .pd-back'); if (b && document.getElementById('ig-dock').classList.contains('is-talk')) b.click(); });
      await ask('#igd-input', 'open explorer');
      const moved = await until(() => window.state && state.view === 'dashboard' && typeof hbFace === 'function' && hbFace() === 'explorer' ? true : null, null, 8000);
      await page.waitForTimeout(300);
      const D = await page.evaluate(DOCK);
      check('3a "open explorer" moves to Explorer, which lands on its own panel', !!moved && !!D && !D.talk, JSON.stringify({ moved: !!moved, talk: D && D.talk, face: await page.evaluate(() => typeof hbFace === 'function' ? hbFace() : null) }));
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
      const L1 = await page.evaluate(() => { const p = document.getElementById('ins-panel'); const tr = p.querySelector('.jl-talk .pd-trail');
        return { id: p.getAttribute('data-ins-id'), body: !p.querySelector('.jl-body').hidden, back: tr ? tr.querySelector('.pd-back').textContent.trim() : null,
          path: tr ? tr.querySelector('.pd-trail-w').textContent.replace(/\s+/g, ' ').trim() : null, window: !!(window.ai && ai.open) }; });
      check('4b a question turns the panel: "‹ Overview  Overview / Jambo", the row still held, the window shut', !!L1 && !L1.body && L1.back === 'Overview' && L1.path === 'Overview / Jambo' && L1.id === L0.id && !L1.window, JSON.stringify(L1));
      await page.click('#ins-panel .jl-talk .pd-back');
      const L2 = await until(() => { const p = document.getElementById('ins-panel'); return p && !p.querySelector('.jl-body').hidden && p.querySelector('.jl-talk').hidden ? p.getAttribute('data-ins-id') : null; }, null, 5000);
      check('4c ‹ Overview returns to the row\'s panel as left', L2 === L0.id, JSON.stringify({ was: L0.id, now: L2 }));
      const lt = () => { const t = document.querySelector('#ins-panel [data-jl-talk]'); return !!t && !t.hidden; };
      check('4d a "Jambo" tab stands beside Overview', await page.evaluate(lt));
      if (await page.evaluate(lt)) await page.click('#ins-panel [data-jl-talk]');
      const L3 = await until(() => { const p = document.getElementById('ins-panel'); return p && !p.querySelector('.jl-talk').hidden && /not moved/.test(p.querySelector('.jl-talk').textContent); }, null, 5000);
      check('4e pressed, the conversation comes back, the question in it', !!L3);
      if (await page.evaluate(lt)) await page.click('#ins-panel [data-jl-talk]');
      const L4 = await until(() => { const p = document.getElementById('ins-panel'); return p && p.querySelector('.jl-talk').hidden && !p.querySelector('.jl-body').hidden; }, null, 5000);
      check('4f pressed again, back to the row\'s panel', !!L4);
    });

    /* ---- 5 Settings — RE-PINNED (owner, 24 Oct 2026, ONE WINDOW: "settings has no information either"): his
       words lead the conversation, a question is answered under them, no tabs, no trail, nothing turned ---- */
    await part('5', async () => {
      await page.evaluate(() => setView('team'));
      await until(() => document.getElementById('st-jb-q') && document.querySelector('#st-jb-feed > *'), null, 8000);
      const S0 = await page.evaluate(() => ({ trail: !document.getElementById('st-jb-trail').hidden, tabs: document.querySelectorAll('#st-side-head .st-side-tab').length }));
      check('5a Settings is one window: his one tab, no trail', !S0.trail && S0.tabs === 1, JSON.stringify(S0));
      await ask('#st-jb-q', 'what is a sealed PDF?');
      const S1 = await until(() => { const T = document.querySelector('#st-jb-feed [data-st-jb-talk]'), L = document.querySelector('#st-jb-feed [data-st-jb-land]');
        return T && !T.hidden && /sealed PDF/.test(T.textContent) ? { land: !!L && !L.hidden, trail: !document.getElementById('st-jb-trail').hidden } : null; }, null, 6000);
      check('5b a question is answered under his words, nothing turned, no trail', !!S1 && S1.land && !S1.trail, JSON.stringify(S1));
    });

    /* ---- 6 the Calendar — RE-PINNED (ONE WINDOW): Your week, then what was asked and the answer ---- */
    await part('6', async () => {
      await page.evaluate(() => hbOpenCalendar());
      await until(() => document.getElementById('cal-plan-in'), null, 8000);
      const C0 = await page.evaluate(() => ({ tabs: document.querySelectorAll('#cal-plan .pd-tab').length, trail: !!document.querySelector('#cal-plan .pd-trail') }));
      check('6a the Calendar is one window: his one tab, no trail', C0.tabs === 1 && !C0.trail, JSON.stringify(C0));
      await ask('#cal-plan-in', 'what is due this week?');
      const C1 = await until(() => { const c = document.getElementById('cal-plan'), t = document.getElementById('cal-plan-talk'), w = c && c.querySelector('.cal-yw');
        return t && /due this week/.test(t.textContent) && w && w.getClientRects().length ? true : null; }, null, 8000);
      check('6b the question and its answer stand under Your week, still in view', !!C1);
    });
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
