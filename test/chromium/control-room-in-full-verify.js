/* Chromium verification: THE CONTROL ROOM, BUILT IN FULL
   ============================================================
   The owner, 16 Oct 2026: "build and for the 4 decisions, go with your
   advice" — every feature of "Settings — the Control Room, built in full".
   Asked where the person looks, at 1440 x 900, with real presses:
     1. Company: Needs you leads; a row's own button opens what settles it
        (everyone's signing limits), and Save writes the server's record
     2. the short cards: two facts that are doors; the ladder card's "What to
        turn on next" opens the rules still off; Team and Who holds what are
        pages with ‹ Settings back, and a refresh comes back to the page
     3. one search: on Settings the bar's box IS ⌘K — "salary" offers the
        signing limits first; the Menu's box finds "logo"
     4. You: a card's door opens its drawer; Jambo's suggestions turned off
        are gone from Settings and from Home's Jambo; a contract opens where
        the person chose (Fill in)
     5. Jambo: a "why" offers the AI with its cost first and answers in words
        (the test's AI stand-in says nothing — a refusal said, never silence)
     6. Ask an admin: an editor's ask is the server's record; the admin finds
        it in Needs you and the bell, answers it, and the editor's bell has
        the answer
     7. a rule's door where it stops someone: the send screen's review row
        carries "Who is checked ›" for an admin
     8. no page errors
   Waits ask for the state, bounded. Red at a7150ed (1-7: none of it existed).
   Run: node test/chromium/control-room-in-full-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, chipEnter } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const shot = async (page, name) => { if (!OUT) return; try { await page.screenshot({ path: path.join(OUT, name + '.png') }); } catch (_) {} };
const signIn = async (page, base, email, pass) => {
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', email); await page.fill('#li-pass', pass);
  await page.click('#li-go');
  await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 2, null, { timeout: 20000 });
};

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    /* the signing-limit rule on, on the server, before anyone signs in:
       three editors with no limit can sign any amount */
    await W.admin.json('/api/settings', { method: 'PUT', body: { signCap: { on: true } } });
    await signIn(page, h.base, 'admin@example.co.ke', 'adminpassword1');
    /* the boot may still be settling on Home: ask for Settings until it holds */
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): Settings is one list; what needs an admin is a row in
       Jambo's panel beside it, the row itself the door */
    const LIMITS = '#ins-panel .jov5-row[data-st-panel="limits"]';
    const rowText = sel => until(q => { const r = document.querySelector(q); return r && r.getBoundingClientRect().width > 0 ? [...r.querySelectorAll('.jov5-rt > *')].map(x => x.textContent).join(' ').replace(/\s+/g, ' ').trim() : null; }, sel, 8000);
    await until(() => { if (!document.querySelector('.stn-page')) { setView('team'); return null; } return document.querySelector('#ins-panel .jov5-title') ? true : null; }, null, 15000);
    const row = await rowText(LIMITS);
    check('1. Needs you leads with "can sign any amount", and the row carries its button', !!row && /any amount/.test(row), row);
    await shot(page, 'company');
    await page.click(LIMITS);
    const lim = await until(() => document.querySelectorAll('#st-dbody [data-st-lim-row]').length || null);
    check('1b. the button opens everyone\'s signing limits, signers only', lim === 3, lim + ' rows');
    const target = await page.evaluate(() => document.querySelector('#st-dbody [data-st-lim-row]').getAttribute('data-st-lim-row'));
    await page.fill(`#st-lim-${target}`, '2500000');
    await page.click('#st-dsave');
    await until(() => !document.getElementById('st-drawer').classList.contains('open'));
    const boot = await W.admin.json('/api/bootstrap');
    const saved = (boot.users || []).find(u => u.id === target);
    check('1c. Save writes the server\'s record, through the person route', saved && saved.signCap === 2500000, JSON.stringify(saved && saved.signCap));
    const fewer = await until(q => { const r = document.querySelector(q); return r && /2 people/.test(r.textContent) ? r.textContent.trim().slice(0, 60) : null; }, LIMITS);
    check('1d. and the row says one fewer, where it stands', !!fewer, fewer);

    /* ---- 2. the two pages ---- */
    /* RETIRED 16 Nov 2026 (#762): 2 (an area card's facts and doors) and 2b ("What to turn on next" on the ladder card) —
       the Company board's cards are the old look's */
    /* RE-POINTED 19 Nov 2026 (Settings, door to door, f1091): People & roles is a row in the Company area */
    await page.evaluate(() => sddGo('company'));
    await page.click('#stn-main [data-sdd-row="people"] [data-st-page="team"]');
    const team = await until(() => document.querySelectorAll('[data-st-pg="team"] tr.st-person').length || null);
    check('2c. Team is a page inside the board', team >= 4, team + ' people');
    await page.reload({ waitUntil: 'networkidle' });
    const back = await until(() => !!document.querySelector('[data-st-pg="team"]'), null, 15000);
    check('2d. a refresh comes back to the Team page', !!back);
    await page.click('.st-pg-back');
    const board = await until(() => !!document.querySelector('.stn-page[data-sdd-area="company"] #stn-main [data-sdd-row="people"]'));
    check('2e. ‹ Company goes back to the Company area', !!board);

    /* ---- 3. one search ---- */
    /* RE-POINTED 29 Oct 2026 (round 1 "The Legora way", owner's yes): the bar's box left; the jump list is "/" */
    await page.evaluate(() => { const a = document.activeElement; if (a && a.blur) a.blur(); openCommandPalette(); });
    await until(() => !!document.getElementById('cp-input'));
    await page.keyboard.type('s');
    const pal = await until(() => !!document.getElementById('cmd-palette'));
    await page.keyboard.type('alary');
    const first = await until(() => { const b = document.querySelector('#cp-list [data-cp-i="0"]'); return b && /Signing limits|Signeringsgränser/.test(b.textContent) ? b.textContent.replace(/\s+/g, ' ').trim().slice(0, 80) : null; });
    check('3. on Settings the jump list leads "salary" with the signing limits', !!pal && !!first, first);
    await page.keyboard.press('Enter');
    const opened = await until(() => { const t = document.querySelector('#st-dhead .rvd-title'); return t && document.getElementById('st-drawer').classList.contains('open') ? t.textContent.trim() : null; });
    check('3b. Enter opens that rule\'s drawer', !!opened, opened);
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    /* RETIRED 16 Nov 2026 (#762): 3c "the Menu's box finds logo as the company design" — the Menu is the old look's (and
       the company design is a page of its own, owner 14 Nov 2026) */

    /* ---- 4. You ---- */
    /* RE-POINTED 16 Nov 2026 (#762): the one list has no "how you work" card; the two flags are in the avatar's account
       drawer (the round-24 You sheet's rows are the old look's) */
    await page.click('#rail-avatar');
    await until(() => !!document.getElementById('pref-jb-chips'));
    await page.click('#pref-jb-chips');
    await until(() => currentUser().prefs && currentUser().prefs.jamboChips === false);
    await page.selectOption('#pref-opens-on', 'fill').catch(async () => {
      await page.evaluate(() => { const s = document.getElementById('pref-opens-on'); s.value = 'fill'; s.dispatchEvent(new Event('change', { bubbles: true })); }); });
    const prefs = await until(() => { const p = currentUser().prefs || {}; return p.opensOn === 'fill' ? JSON.stringify(p) : null; });
    check('4. the two flags change in your account, saved as they change', !!prefs, prefs);
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    /* RETIRED 16 Nov 2026 (#762): 4b "none beside Settings" — the old side feed's chips; 4d below keeps the promise on Home */
    await page.evaluate(() => { const c = state.contracts.find(x => x.status === 'Draft') || state.contracts[0]; regOpenContract(c.id); });
    /* RETIRED 17 Nov 2026 (#762, round 6 default): 4c "a contract opened from the list lands on Fill in (Still owed's grid)" — a contract opened
       from a list lands on its Cover (Cover-first), and the new one-card Dossier has no Still owed grid */
    await until(() => !!document.getElementById('ig-dock'), null, 12000);
    const homeChips = await page.evaluate(() => document.querySelectorAll('#ig-dock [data-ig-chips] button').length);
    check('4d. and Home\'s Jambo shows no suggestion chips', homeChips === 0, homeChips + ' chips');
    await page.evaluate(() => stPrefSet('jamboChips', true));
    await page.evaluate(() => stPrefSet('opensOn', 'jambo'));

    /* ---- 5. Jambo's why ---- */
    /* RE-POINTED 16 Nov 2026 (#762): asked in the panel's own box (#jl-q) beside the one list */
    await page.evaluate(() => { try { settingsGoPage(''); } catch (_) {} setView('team'); });
    await until(() => !!document.querySelector('.stn-page #ins-panel #jl-q'));
    /* RE-POINTED 17 Nov 2026 (the new look is the only look, #762; round 6 default, and the owner 8 Nov 2026: "no Jambo call is
       said anywhere"): the old side feed's "why" card with its own AI press is the old look's — jlAsk's Settings block leaves
       the 'why' card out. A "why" typed is answered in the panel's talk by HaTi's own reading of the rules: the person asked
       about, their card (what they see, their signing limit), no Jambo call made and no cost said; never silence */
    const callsBefore = h.ai.calls.length;
    await page.fill('#jl-q', 'Why can\'t Restricted Legal sign the Naivas deal?'); await chipEnter(page, '#jl-q');
    const said = await until(() => { const f = document.querySelector('#ins-panel #jl-feed'); if (!f) return null;
      const t = [...f.querySelectorAll('.jb-turn[data-jb-born="ai"]')].pop(); const m = t && t.querySelector('.ai-msg:not(.justify-end)');
      const txt = m ? m.textContent.replace(/\s+/g, ' ').trim() : '';
      return txt.length > 10 ? txt.slice(0, 240) : null; }, null, 15000);
    const talk = await page.evaluate(() => ((document.querySelector('#ins-panel') || {}).innerText || ''));
    check('5. a "why" is answered in the panel from the rules — the person\'s own card, no Jambo call, no cost said',
      !!said && /Restricted Legal/.test(said) && /sign up to/i.test(said) && h.ai.calls.length === callsBefore && !/\bcalls?\b|Jambo-anrop|\bfree\b|costs? nothing/i.test(talk), JSON.stringify({ said, calls: h.ai.calls.length - callsBefore }));
    /* RETIRED 17 Nov 2026 (#762, round 6 default): 5b "the press is one Jambo call, its answer said on the card" — the "why" card's
       own AI press is the old side feed's; the new panel answers a why from the rules without Jambo (above) */

    /* ---- 6. ask an admin ---- */
    const ed = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    ed.on('pageerror', e => errors.push('editor: ' + e.message));
    await signIn(ed, h.base, 'everything@example.co.ke', 'their-own-pass-9');
    await ed.evaluate(() => setView('team'));
    /* RE-POINTED 16 Nov 2026 (#762): beside the one list, Jambo's panel carries Ask an admin as a row (data-st-ask-head);
       pressed, it puts the ask in front of them (the old side feed's answer card is the old look's) */
    await ed.waitForFunction(() => !!document.querySelector('.stn-page #ins-panel [data-st-ask-head]'), null, { timeout: 10000 });
    await ed.click('#ins-panel [data-st-ask-head]');
    const form = await ed.waitForFunction(() => !!document.querySelector('[data-st-ask-admin]'), null, { timeout: 8000 }).then(() => true).catch(() => false);
    if (form) {
      await ed.locator('textarea[id^="st-ask-what-"]').last().fill('HR offer letters go out unchecked');
      await ed.locator('[data-st-ask-admin]').last().click();
    } else check('6. Ask an admin puts the ask in front of them', false, 'no ask form after the press');
    const asked = await ed.waitForFunction(() => /Asked|Frågat/.test(([...document.querySelectorAll('.st-jb-turn')].pop() || {}).textContent || ''), null, { timeout: 8000 }).then(() => true).catch(() => false);
    check('6. an editor\'s ask is sent, and Jambo says where it waits', asked);
    /* the count moves at once; the row is drawn on the next paint (the page
       holds still under the reader's hand) */
    /* RE-POINTED 16 Nov 2026 (#762): the admin finds it as a row in Jambo's panel beside the one list */
    const ASK = '#ins-panel .jov5-row[data-st-panel^="ask:"]';
    await page.evaluate(async () => { await stAsksLoad(); setView('team'); });
    /* RE-POINTED 16 Nov 2026 (#762): the admin typed in this panel at step 5, so it still shows his talk and the
       Overview (where Needs you's rows stand) is hidden under it — the reader presses the one way back above the box first */
    if (await page.evaluate(() => { const d = document.querySelector('#ins-panel [data-jb-door]'); return !!d && !d.hidden && d.offsetParent !== null; })) await page.click('#ins-panel [data-jb-door] .jb-door-back');
    const need = await until(q => { const r = document.querySelector(q); return r && r.offsetParent !== null ? r.textContent.replace(/\s+/g, ' ').trim().slice(0, 80) : null; }, ASK);
    check('6b. the admin finds it in Needs you', !!need && /Unrestricted Legal/.test(need), need);
    const bell = await page.evaluate(() => buildAlerts().some(a => a.kind === 'settings-ask'));
    check('6c. and in the bell', bell);
    if (need) {
      await page.click(ASK);
      await until(() => !!document.querySelector('#st-dbody [data-st-ask-to="done"]'));
      await page.click('#st-dbody [data-st-ask-to="done"]');
    }
    await until(q => !document.querySelector(q), ASK);
    await ed.evaluate(() => stAsksLoad());
    const answer = await ed.waitForFunction(() => buildAlerts().some(a => a.kind === 'settings-answer'), null, { timeout: 8000 }).then(() => true).catch(() => false);
    check('6d. answered, the editor\'s bell has the answer', answer);

    /* ---- 7. a rule's door on the send screen ---- */
    await page.evaluate(() => { saveReviewGateCfg({ ...(reviewGateCfg() || {}), on: true, when: 'always' }); });
    const door = await page.evaluate(() => {
      const c = state.contracts.find(x => x.status === 'Under Review' || x.status === 'Draft') || state.contracts[0];
      const box = document.createElement('div'); box.innerHTML = readinessPanelHtml(c);
      return { review: contractReadiness(c).some(x => x.key === 'review' && x.severity === 'block'), door: !!box.querySelector('[data-rd-rule="review"]') };
    });
    check('7. where review holds a send, an admin\'s row carries "Who is checked ›"', !door.review || door.door, JSON.stringify(door));

    /* ---- 7b. WORK ASKED IN SETTINGS' BOX (21 Oct 2026): "upload a contract" found a mail-in setting and
       "new contract" the sample contracts; both are work, so they go to Home's Jambo, who acts on them ---- */
    /* RE-POINTED 16 Nov 2026 (#762): Settings' box is the panel's own (#jl-q) beside the one list */
    const inSettings = () => until(() => { if (window.closeModal) try { closeModal(); } catch (_) {}
      if (!document.querySelector('.stn-page #ins-panel #jl-q')) { setView('team'); return null; } return true; }, null, 15000);
    /* RE-POINTED 27 Oct 2026 (owner: "roll out the jambo capabilities from the board's jambo to all the jambos"): typed
       on Settings' Jambo tab the words go to the chat; these steps are about the free readers, so they type under Overview */
    const askIn = async q => { await inSettings(); await page.fill('#jl-q', q); await chipEnter(page, '#jl-q');
      return until(q => { const f = document.getElementById('igd-feed'); const t = f ? f.textContent.replace(/\s+/g, ' ') : '';
        return state.view === 'dashboard' && t.includes(q) ? t.slice(t.lastIndexOf(q)) : null; }, q, 8000); };
    const up = await askIn('upload a contract');
    check('7b. "upload a contract" in Settings\' box goes to Home\'s Jambo, who offers Upload a document', !!up && /Upload a document/.test(up), up);
    const nw = await (async () => { await inSettings(); await page.fill('#jl-q', 'new contract'); await chipEnter(page, '#jl-q'); return 'new contract'; })();
    /* RE-POINTED 24 Oct 2026 (one door, the Legora way): "new contract" is no longer a card in the chat —
       it opens the one New agreement sheet on Home, beside Jambo's panel */
    const nwSheet = await until(() => state.view === 'dashboard' && document.getElementById('na-root') && document.getElementById('ig-dock') ? true : null, null, 8000);
    check('7c. "new contract" in Settings\' box goes to Home, where the New agreement sheet opens beside Jambo', !!nwSheet, nw);
    await page.evaluate(() => { const b = document.getElementById('wz-pick-cancel'); if (b) b.click(); });

    check('8. no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'clean');
  } catch (e) {
    check('the run completed', false, e && e.message);
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} failed` : '\nall passed');
  process.exit(failures ? 1 : 0);
})();
