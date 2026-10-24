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
const { startHati, seedWorkspace } = require('../helpers');

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
    const row = await until(() => {
      if (!document.getElementById('set-page') || settingsTab() !== 'company') { setView('team'); settingsGoTab('company'); return null; }
      const r = document.querySelector('#st-att .st-need[data-st-need="limits"] button');
      return r && r.getBoundingClientRect().width > 0 ? r.textContent.trim() : null; }, null, 15000);
    check('1. Needs you leads with "can sign any amount", and the row carries its button', !!row, row);
    await shot(page, 'company');
    await page.click('#st-att .st-need[data-st-need="limits"] button');
    const lim = await until(() => document.querySelectorAll('#st-dbody [data-st-lim-row]').length || null);
    check('1b. the button opens everyone\'s signing limits, signers only', lim === 3, lim + ' rows');
    const target = await page.evaluate(() => document.querySelector('#st-dbody [data-st-lim-row]').getAttribute('data-st-lim-row'));
    await page.fill(`#st-lim-${target}`, '2500000');
    await page.click('#st-dsave');
    await until(() => !document.getElementById('st-drawer').classList.contains('open'));
    const boot = await W.admin.json('/api/bootstrap');
    const saved = (boot.users || []).find(u => u.id === target);
    check('1c. Save writes the server\'s record, through the person route', saved && saved.signCap === 2500000, JSON.stringify(saved && saved.signCap));
    const fewer = await until(() => { const r = document.querySelector('#st-att .st-need[data-st-need="limits"]'); return r && /2 people/.test(r.textContent) ? r.textContent.trim().slice(0, 60) : null; });
    check('1d. and the row says one fewer, where it stands', !!fewer, fewer);

    /* ---- 2. the cards, the ladder, the two pages ---- */
    const card = await page.evaluate(() => { const c = document.querySelector('[data-st-card="signing"]'); return c ? { facts: c.querySelectorAll('.st-fact').length, doors: c.querySelectorAll('.st-door').length } : null; });
    check('2. an area card: two facts that are doors, then doors', card && card.facts === 2 && card.doors >= 1, JSON.stringify(card));
    await page.click('[data-st-card="ladder"] .st-door[data-st-panel="gates"]');
    const gates = await until(() => document.querySelectorAll('#st-dbody .st-gate-row').length || null);
    check('2b. "What to turn on next" opens the rules still off', gates >= 3, gates + ' rules off');
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    await page.click('[data-st-card="people"] .st-door[data-st-page="team"]');
    const team = await until(() => document.querySelectorAll('[data-st-pg="team"] tr.st-person').length || null);
    check('2c. Team is a page inside the board', team >= 4, team + ' people');
    await page.reload({ waitUntil: 'networkidle' });
    const back = await until(() => !!document.querySelector('[data-st-pg="team"]'), null, 15000);
    check('2d. a refresh comes back to the Team page', !!back);
    await page.click('.st-pg-back');
    const board = await until(() => !!document.querySelector('.st-cards [data-st-card="people"]'));
    check('2e. ‹ Settings goes back to the board', !!board);

    /* ---- 3. one search ---- */
    await page.click('#cmd-search');
    await page.keyboard.type('s');
    const pal = await until(() => !!document.getElementById('cmd-palette'));
    await page.keyboard.type('alary');
    const first = await until(() => { const b = document.querySelector('#cp-list [data-cp-i="0"]'); return b && /Signing limits|Signeringsgränser/.test(b.textContent) ? b.textContent.replace(/\s+/g, ' ').trim().slice(0, 80) : null; });
    check('3. on Settings the bar\'s box is ⌘K, and "salary" leads with the signing limits', !!pal && !!first, first);
    await page.keyboard.press('Enter');
    const opened = await until(() => { const t = document.querySelector('#st-dhead .rvd-title'); return t && document.getElementById('st-drawer').classList.contains('open') ? t.textContent.trim() : null; });
    check('3b. Enter opens that rule\'s drawer', !!opened, opened);
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    /* re-pointed 18 Oct 2026 (rounds 24–26 as drawn): the Menu is no tab;
       "/" in Jambo's box opens it, and its head carries ‹ Jambo back.
       RE-POINTED AGAIN 19 Oct 2026 (lane F's fourth pass): main's rule won —
       "/" in every Jambo box lists the places (caSlRead) — so the Menu is
       reached through Jambo's own "Open the Menu", under the answer he gives
       when he finds no setting */
    await page.fill('#st-jb-q', 'zzqx nothing here'); await page.keyboard.press('Enter');
    await until(() => !!document.querySelector('#st-jb-feed [data-st-side="menu"]'));
    if (await page.locator('#st-jb-feed [data-st-side="menu"]').count()) await page.locator('#st-jb-feed [data-st-side="menu"]').last().click();
    await page.fill('#st-q', 'logo');
    const menu = await until(() => !!document.querySelector('#st-list .st-mrow[data-st-panel="design"]'));
    check('3c. the Menu\'s box finds "logo" as the company design', !!menu);
    await page.fill('#st-q', '');
    await page.click('[data-st-side="jambo"]');

    /* ---- 4. You ---- */
    await page.click('.st-face[data-st-tab="you"]');
    await until(() => !!document.querySelector('[data-st-you-card="work"]'));
    /* since round 24 (One sheet) the two flags change IN THEIR ROWS */
    await until(() => !!document.querySelector('[data-st-you-card="work"] [data-st-sw="chips"]'));
    await page.click('[data-st-you-card="work"] [data-st-sw="chips"]');
    await until(() => currentUser().prefs && currentUser().prefs.jamboChips === false);
    await page.selectOption('[data-st-opens]', 'fill').catch(async () => {
      await page.evaluate(() => { const s = document.querySelector('[data-st-opens]'); s.value = 'fill'; s.dispatchEvent(new Event('change', { bubbles: true })); }); });
    const prefs = await until(() => { const p = currentUser().prefs || {}; return p.opensOn === 'fill' ? JSON.stringify(p) : null; });
    check('4. the two flags change in their rows on You, saved as they change', !!prefs, prefs);
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    const noChips = await until(() => document.querySelectorAll('#st-side .st-jb-chip').length === 0);
    check('4b. Jambo\'s suggestions off: none beside Settings', !!noChips);
    await page.evaluate(() => { const c = state.contracts.find(x => x.status === 'Draft') || state.contracts[0]; regOpenContract(c.id); });
    /* RE-POINTED 20 Oct 2026 (the Legora way): "Fill in" is the Dossier's Still owed grid, its first owed row in the hand */
    const fill = await until(() => { const a = document.activeElement; return !!document.querySelector('#ig-dock #pd-og') && !!(a && a.closest && a.closest('#pd-og')); }, null, 12000);
    check('4c. a contract opened from the list lands on Fill in (Still owed\'s grid), as chosen', !!fill);
    const homeChips = await page.evaluate(() => document.querySelectorAll('#ig-dock [data-ig-chips] button').length);
    check('4d. and Home\'s Jambo shows no suggestion chips', homeChips === 0, homeChips + ' chips');
    await page.evaluate(() => stPrefSet('jamboChips', true));
    await page.evaluate(() => stPrefSet('opensOn', 'jambo'));

    /* ---- 5. Jambo's why ---- */
    await page.evaluate(() => { setView('team'); settingsGoTab('company'); stSideSet('jambo'); });
    await until(() => !!document.getElementById('st-jb-q'));
    await page.fill('#st-jb-q', 'Why can\'t Restricted Legal sign the Naivas deal?');
    await page.press('#st-jb-q', 'Enter');
    const cost = await until(() => { const t = [...document.querySelectorAll('.st-jb-turn')].pop(); return t && t.querySelector('[data-st-jb-why]') ? t.textContent : null; });
    check('5. a "why" offers the AI, its cost said before the press', !!cost && /Jambo call|Jambo-anrop/.test(cost));
    const callsBefore = h.ai.calls.length;
    /* RE-POINTED 21 Oct 2026 (one conversation): a turn sits in its host wrapper with its read line after it, so the last turn is the last wrapper's */
    await page.click('#st-jb-feed .jb-turn:last-child .st-jb-turn [data-st-jb-why]');
    const said = await until(() => { const t = [...document.querySelectorAll('.st-jb-turn')].pop(); const c = t && t.querySelector('.st-jb-ai .st-jb-cb'); return c && !c.querySelector('.ob-spin') && c.textContent.trim().length > 10 ? c.textContent.trim().slice(0, 100) : null; }, null, 15000);
    check('5b. the press is one Jambo call, and its answer — or why there is none — is said on the card', h.ai.calls.length === callsBefore + 1 && !!said, said);

    /* ---- 6. ask an admin ---- */
    const ed = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    ed.on('pageerror', e => errors.push('editor: ' + e.message));
    await signIn(ed, h.base, 'everything@example.co.ke', 'their-own-pass-9');
    await ed.evaluate(() => setView('team'));
    await ed.waitForFunction(() => !!document.getElementById('st-jb-q'), null, { timeout: 10000 });
    await ed.fill('#st-jb-q', 'turn on internal review');
    await ed.press('#st-jb-q', 'Enter');
    await ed.waitForFunction(() => !!document.querySelector('#st-jb-feed .jb-turn:last-child .st-jb-turn [data-st-ask-admin]'), null, { timeout: 8000 });
    await ed.fill('#st-jb-feed .jb-turn:last-child .st-jb-turn textarea', 'HR offer letters go out unchecked');
    await ed.click('#st-jb-feed .jb-turn:last-child .st-jb-turn [data-st-ask-admin]');
    const asked = await ed.waitForFunction(() => /Asked|Frågat/.test(([...document.querySelectorAll('.st-jb-turn')].pop() || {}).textContent || ''), null, { timeout: 8000 }).then(() => true).catch(() => false);
    check('6. an editor\'s ask is sent, and Jambo says where it waits', asked);
    /* the count moves at once; the row is drawn on the next paint (the page
       holds still under the reader's hand) */
    await page.evaluate(async () => { await stAsksLoad(); settingsGoTab('company'); });
    const need = await until(() => { const r = document.querySelector('#st-att .st-need[data-st-need^="ask:"]'); return r ? r.textContent.replace(/\s+/g, ' ').trim().slice(0, 80) : null; });
    check('6b. the admin finds it in Needs you', !!need && /Unrestricted Legal/.test(need), need);
    const bell = await page.evaluate(() => buildAlerts().some(a => a.kind === 'settings-ask'));
    check('6c. and in the bell', bell);
    await page.click('#st-att .st-need[data-st-need^="ask:"] button');
    await until(() => !!document.querySelector('#st-dbody [data-st-ask-to="done"]'));
    await page.click('#st-dbody [data-st-ask-to="done"]');
    await until(() => !document.querySelector('#st-att .st-need[data-st-need^="ask:"]'));
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
    const inSettings = () => until(() => { if (window.closeModal) try { closeModal(); } catch (_) {}
      if (!document.getElementById('st-jb-q')) { setView('team'); return null; } return true; }, null, 15000);
    const askIn = async q => { await inSettings(); await page.fill('#st-jb-q', q); await page.press('#st-jb-q', 'Enter');
      return until(q => { const f = document.getElementById('igd-feed'); const t = f ? f.textContent.replace(/\s+/g, ' ') : '';
        return state.view === 'dashboard' && t.includes(q) ? t.slice(t.lastIndexOf(q)) : null; }, q, 8000); };
    const up = await askIn('upload a contract');
    check('7b. "upload a contract" in Settings\' box goes to Home\'s Jambo, who offers Upload a document', !!up && /Upload a document/.test(up), up);
    const nw = await (async () => { await inSettings(); await page.fill('#st-jb-q', 'new contract'); await page.press('#st-jb-q', 'Enter'); return 'new contract'; })();
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
