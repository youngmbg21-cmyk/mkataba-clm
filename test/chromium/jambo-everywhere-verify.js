/* ============================================================
   JAMBO, THE SAME ON EVERY PAGE (the owner, 18 Oct 2026: "In the calendar I
   can't use jambo to move to another page as it is only there to support the
   calendar … Jambo should work with the same powers as the jambo in the home
   page")
   ============================================================
   Every Jambo box reads what was typed through the one reader Home's box uses
   first (caAskAnywhere); only what it does not take goes to the page's own
   job. Driven in a real browser:
     1  the Calendar's box: a page's name moves there, a contract's number opens
        its paper, "draft a new agreement" lands on the one Draft card — and
        none of them is sent to the planner (no /api/ai/plan); a planning
        question still goes to the planner
     2  "/" in the Calendar's box lists the places; Enter on one goes there
     3  Settings' box: a page's name moves there; a setting's words stay with
        the settings finder
     4  the pop-up Jambo window on another page: a page's name moves there and
        he says so in one line; nothing spent
     5  the owner's three screens: the "/" list stands above the box, in sight
     6  the clause editor: a page's name leaves through the editor's own way
        out (its question first, were a draft unfiled), no model asked
   AT THE PARENT 1, 2, 3 and 4 FAIL: those boxes read nothing but their own job.
     node test/chromium/jambo-everywhere-verify.js
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'jambo-everywhere');
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
const CONTRACTS = [
  H.fixtureContract('MK-J1', 'Raw Material Supply Agreement', 'Nandi Dairy', H.FOLDER_A, 800000, 'Under Review'),
  H.fixtureContract('MK-J2', 'Office lease', 'Britam Properties', H.FOLDER_B, 4e6, 'Signed'),
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  await H.seedWorkspace(h, { contracts: CONTRACTS, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const ai = []; page.on('request', r => { if (/\/api\/ai\//.test(r.url())) ai.push(r.url().replace(/^.*\/api\//, '')); });
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const shot = n => page.screenshot({ path: path.join(OUT, n + '.png') }).catch(() => {});
    const toCal = async () => { await page.evaluate(() => hbOpenCalendar()); return until(() => !!document.getElementById('cal-plan-in')); };
    const typeIn = async (sel, words) => { await page.click(sel); await page.fill(sel, ''); await page.type(sel, words, { delay: 6 }); await page.keyboard.press('Enter'); };

    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length === 2, null, { timeout: 20000 });
    await page.keyboard.press('Escape').catch(() => {});
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) await en.click();

    /* ===== 1 · THE CALENDAR'S BOX ===== */
    check('1 (setup) the Calendar\'s Jambo box is up', !!(await toCal()));
    ai.length = 0;
    await typeIn('#cal-plan-in', 'approvals');
    const v1 = await until(() => state.view === 'approvals' ? 'approvals' : null, null, 6000);
    check('1a a page\'s name in the Calendar\'s box moves there', v1 === 'approvals', String(await page.evaluate(() => state.view)));
    await toCal();
    await typeIn('#cal-plan-in', 'MK-J1');
    const p1 = await until(() => state.view === 'dashboard' && window.intel && intel.paper && intel.paper.id === 'MK-J1' ? true : null, null, 8000);
    check('1b a contract\'s number opens its paper', !!p1, JSON.stringify(await page.evaluate(() => ({ view: state.view, paper: window.intel && intel.paper && intel.paper.id }))));
    await toCal();
    await typeIn('#cal-plan-in', 'draft a new agreement');
    const d1 = await until(() => { const c = document.querySelector('#ig-dock .ca-dr'); const card = c && c.closest('[data-ca-card]');
      return card && card.classList.contains('is-landed') ? document.querySelectorAll('#ig-dock .ca-dr').length : null; }, null, 8000);
    check('1c "draft a new agreement" lands on the one Draft card, lit', d1 === 1, String(d1));
    check('1d none of them was sent to the planner or any model', !ai.length, ai.join(', '));
    await toCal();
    ai.length = 0;
    await typeIn('#cal-plan-in', 'find me two hours this week for the lease');
    const plan = await until(n => (window._calPlanSeen = (document.getElementById('cal-plan') || {}).textContent || '') && state.view === 'dashboard' && hbFace() === 'calendar'
      && /find me two hours/.test(document.querySelector('#cal-plan .cal-plan-you') ? document.querySelector('#cal-plan .cal-plan-you').textContent : '') ? true : null, null, 6000);
    check('1e a planning question stays with the Calendar\'s own planner', !!plan, (await page.evaluate(() => (document.querySelector('#cal-plan .cal-plan-you') || {}).textContent || '')).slice(0, 60));

    /* ===== 2 · "/" IN THE CALENDAR'S BOX ===== */
    await toCal();
    /* the planner's answer to 1e (here, that no key is set) frees the box */
    await until(() => { const i = document.getElementById('cal-plan-in'); return i && !i.disabled ? true : null; }, null, 10000);
    await page.click('#cal-plan-in'); await page.fill('#cal-plan-in', ''); await page.type('#cal-plan-in', '/appr', { delay: 20 });
    const list = await until(() => { const el = document.getElementById('ca-slash'); if (!el) return null;
      const r = el.getBoundingClientRect(), b = document.getElementById('cal-plan-in').getBoundingClientRect();
      return { rows: [...el.querySelectorAll('[data-ca-sl]')].map(x => x.textContent.trim().slice(0, 30)), above: r.bottom <= b.top + 1, inView: r.top >= 0 && r.right <= innerWidth + 1 }; }, null, 4000);
    check('2a "/" lists the places above the box', !!list && list.rows.length >= 1 && list.above && list.inView, JSON.stringify(list));
    await shot('2-slash-1440x780');
    await page.keyboard.press('Enter');
    const v2 = await until(() => state.view === 'approvals' && !document.getElementById('ca-slash') ? true : null, null, 6000);
    check('2b Enter on a row goes there, and the list is gone', !!v2, JSON.stringify(await page.evaluate(() => ({ view: state.view, list: !!document.getElementById('ca-slash') }))));

    /* ===== 3 · SETTINGS' BOX ===== */
    const openSt = async () => { await page.evaluate(() => setView('team')); await until(() => !!document.getElementById('st-jb-q'), null, 6000)
      || await page.evaluate(() => { if (window.stSideSet) stSideSet('jambo'); }); return until(() => !!document.getElementById('st-jb-q'), null, 4000); };
    const st = await openSt();
    check('3 (setup) Settings\' Jambo box is up', !!st);
    if (st) {
      ai.length = 0;
      await typeIn('#st-jb-q', 'calendar');
      const v3 = await until(() => state.view === 'dashboard' && hbFace() === 'calendar' ? true : null, null, 6000);
      check('3a a page\'s name in Settings\' box moves there', !!v3, String(await page.evaluate(() => state.view)));
      await openSt();
      await typeIn('#st-jb-q', 'two-step sign-in');
      const kept = await until(() => state.view === 'team' && document.querySelectorAll('#st-jb-feed [data-st-jb-turn]').length >= 1 ? true : null, null, 4000);
      check('3b a setting\'s words stay with the settings finder', !!kept, String(await page.evaluate(() => state.view)));
      check('3c and nothing was spent', !ai.length, ai.join(', '));
    }

    /* ===== 4 · THE POP-UP WINDOW ON ANOTHER PAGE ===== */
    await page.evaluate(() => setView('approvals'));
    await until(() => state.view === 'approvals', null, 4000);
    await page.evaluate(() => openAI());
    const up = await until(() => { const p = document.getElementById('ai-panel'); return p && p.classList.contains('open') && !!document.getElementById('ai-input') ? true : null; }, null, 4000);
    check('4 (setup) the window is open over Approvals', !!up);
    if (up) {
      ai.length = 0;
      await page.click('#ai-input'); await page.fill('#ai-input', ''); await page.type('#ai-input', 'obligations', { delay: 6 }); await page.keyboard.press('Enter');
      const v4 = await until(() => state.view !== 'approvals' ? state.view : null, null, 6000);
      const said = await page.evaluate(() => [...document.querySelectorAll('#ai-feed .ai-msg, #ai-feed > *')].map(x => x.textContent.trim()).filter(Boolean).slice(-2));
      check('4a a page\'s name in the window moves there', !!v4 && v4 !== 'approvals', String(v4));
      check('4b and he says so in one line', said.length >= 1 && /obligations/i.test(said.join(' ')), JSON.stringify(said));
      check('4c nothing spent', !ai.length, ai.join(', '));
    }

    /* ===== 6 · THE CLAUSE EDITOR: a page's name leaves through its own way out ===== */
    await page.setViewportSize({ width: 1440, height: 780 });
    const ed = await page.evaluate(async () => { try { const c = getContract('MK-J1'); if (c._light && typeof ensureFull === 'function') await ensureFull(c);
      const cl = negoClauseList(c).find(x => (x.text || '').length > 20); if (!cl) return 'no clause'; rlOpenClauseEditor(c, cl.clauseId); return true; } catch (e) { return String(e && e.message); } });
    const edUp = ed === true && await until(() => !!document.getElementById('ce-ask') && window.clauseEditorOpen && clauseEditorOpen() ? true : null, null, 8000);
    check('6 (setup) the clause editor is open', !!edUp, String(ed));
    if (edUp) {
      ai.length = 0;
      await page.click('#ce-ask'); await page.fill('#ce-ask', ''); await page.type('#ce-ask', 'approvals', { delay: 6 }); await page.keyboard.press('Enter');
      const v6 = await until(() => state.view === 'approvals' && !(window.clauseEditorOpen && clauseEditorOpen()) ? true : null, null, 6000);
      check('6a a page\'s name in the editor\'s Jambo box leaves the editor for that page (nothing typed, so nothing asked)', !!v6, JSON.stringify(await page.evaluate(() => ({ view: state.view, open: !!(window.clauseEditorOpen && clauseEditorOpen()) }))));
      check('6b and asks no model', !ai.length, ai.join(', '));
    }

    /* ===== 5 · THE OWNER'S THREE SCREENS ===== */
    for (const [w, hh] of SCREENS) {
      await page.setViewportSize({ width: w, height: hh });
      await toCal();
      await page.click('#cal-plan-in'); await page.fill('#cal-plan-in', ''); await page.type('#cal-plan-in', '/', { delay: 20 });
      const L = await until(() => { const el = document.getElementById('ca-slash'); if (!el) return null; const r = el.getBoundingClientRect();
        return { top: Math.round(r.top), bottom: Math.round(r.bottom), right: Math.round(r.right), n: el.querySelectorAll('[data-ca-sl]').length, sx: document.scrollingElement.scrollWidth > innerWidth }; }, null, 4000);
      check(`5 at ${w}×${hh}: the "/" list is in sight above the box, no sideways scroll`, !!L && L.top >= 0 && L.right <= w + 1 && !L.sx && L.n >= 5, JSON.stringify(L));
      await shot(`5-slash-${w}x${hh}`);
      await page.keyboard.press('Escape');
    }

    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.stack ? e.stack.slice(0, 400) : String(e));
  } finally {
    await browser.close().catch(() => {}); await h.stop().catch(() => {});
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
