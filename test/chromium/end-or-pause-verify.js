/* END OR PAUSE — ONE QUESTION, measured in a real browser.
 *
 * The owner picked "One question" by name on 15 Oct 2026, off the
 * end-or-pause options page: Decline, Archive and Hold sat in different
 * menus and nothing said how they differ. One door now asks "What is
 * happening with this deal?"; the answer names the button; each answer is the
 * existing act. The way back (Restore, Release, Reopen) keeps its own row.
 *
 * WHAT THIS DRIVES, where the user looks:
 *   1. the paper's menu (Jambo's Menu tab on Home) carries the one door, and
 *      not the three rows;
 *   2. the door asks the question, three answers, the act grey until one is
 *      chosen;
 *   3. Archive: the button says "Archive it", a note is optional, pressing it
 *      archives (the existing act, with its audit line), the window closes;
 *   4. Hold: grey until the reason is written, then "Put on hold"; held, the
 *      menu offers Release, and the door greys "hold" with its reason;
 *   5. signed paper: "decline" is grey with the act's own reason;
 *   6. the Contracts row's ⋯ carries the same door, not the three rows;
 *   7. Jambo's words "put … on hold" open the same window, hold chosen;
 *   8. Esc closes it and nothing changes.
 * Every driven half is guarded, so a missing feature REPORTS rather than
 * times out. Photographed at the owner's three screens. */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FIXTURES } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'end-or-pause');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: FIXTURES, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  const until = (page, fn, arg, ms = 8000) => page.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);
  try {
    const ctx = await browser.newContext({ viewport: { width: 1536, height: 730 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await until(page, () => window.state && state.contracts && state.contracts.length > 0, null, 15000);
    const menuOf = async id => {
      await page.evaluate(() => { if (state.view !== 'dashboard') setView('dashboard'); });
      await until(page, () => state.view === 'dashboard');
      /* Home draws in steps after sign-in: ask again until the Menu tab is up on this contract */
      for (let i = 0; i < 4; i++) {
        await page.evaluate(x => { pdOpenOnHome(x, 'menu'); }, id);
        if (await until(page, x => (pdContract() || {}).id === x && !!document.querySelector('.pd-menu #ws-filing'), id, 3000)) break;
      }
      /* the row's group is folded until its heading is pressed, as a reader would */
      await page.evaluate(() => { const d = (document.querySelector('.pd-menu #ws-end') || document.querySelector('.pd-menu #ws-advice') || { closest: () => null }).closest('details');
        if (d && !d.open) d.querySelector('summary').click(); });
      return page.evaluate(() => ({ end: !!document.querySelector('.pd-menu #ws-end'),
        archive: !!document.querySelector('.pd-menu #ws-archive'), hold: !!document.querySelector('.pd-menu #ws-hold') }));
    };
    const dlg = () => page.evaluate(() => {
      const o = document.getElementById('end-overlay'); if (!o) return null;
      const go = o.querySelector('#end-go');
      return { q: (o.querySelector('#end-q') || {}).textContent, answers: [...o.querySelectorAll('[data-end]')].map(l => ({ k: l.getAttribute('data-end'), off: l.classList.contains('is-off'), why: (l.querySelector('.sap-m') || {}).textContent })),
        go: go.textContent.trim(), grey: go.disabled, why: go.title || '', last: !!o.querySelector('.dlg-f > :last-child[data-dlg-cancel]') };
    });

    /* ===== 1. THE PAPER'S MENU: ONE DOOR, NOT THREE ROWS ===== */
    const m1 = await menuOf('MK-B2');
    ok('1 the paper\'s menu carries End or pause, and no Archive or Hold rows', m1.end && !m1.archive && !m1.hold, JSON.stringify(m1));

    /* ===== 2. THE QUESTION ===== */
    if (m1.end) await page.click('.pd-menu #ws-end');
    const opened = await until(page, () => !!document.getElementById('end-overlay'));
    const d2 = opened ? await dlg() : null;
    ok('2a it asks what is happening with the deal, three answers', !!d2 && d2.q === 'What is happening with this deal?' && d2.answers.map(a => a.k).join() === 'decline,archive,hold', JSON.stringify(d2));
    ok('2b nothing is chosen for you: the act is grey and says why, Cancel last', !!d2 && d2.grey && d2.go === 'Choose an answer' && /Choose what is happening/.test(d2.why) && d2.last, JSON.stringify(d2));
    for (const [w, ht] of SCREENS) {
      await page.setViewportSize({ width: w, height: ht });
      await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(OUT, `2-question-${w}x${ht}.png`) });
      const fits = await page.evaluate(() => { const r = document.querySelector('#end-overlay [role="dialog"]').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth; });
      ok(`2c it fits the window at ${w}×${ht}`, fits);
    }
    await page.setViewportSize({ width: 1536, height: 730 });

    /* ===== 3. ARCHIVE: THE ANSWER NAMES THE BUTTON, A NOTE IS OPTIONAL ===== */
    if (opened) await page.click('#end-overlay [data-end="archive"]');
    const d3 = opened ? await dlg() : null;
    ok('3a "Archive it", live with no note', !!d3 && d3.go === 'Archive it' && !d3.grey, JSON.stringify(d3));
    if (opened) await page.fill('#end-note', 'Finished; filed with the board pack.');
    if (opened) await page.click('#end-go');
    const archived = await until(page, () => !document.getElementById('end-overlay') && !!(getContract('MK-B2') || {}).archived);
    const trail = await page.evaluate(() => ((getContract('MK-B2').audit || []).find(a => a.action === 'Archived') || {}).detail || '');
    ok('3b pressing it archives, with the note on the history, and the window closes', archived && /filed with the board pack/.test(trail), trail);
    const m3 = await menuOf('MK-B2');
    ok('3c archived, the menu offers Restore beside the door', m3.archive && m3.end, JSON.stringify(m3));

    /* ===== 4. HOLD: A REASON FIRST; HELD, RELEASE IS ITS OWN ROW ===== */
    await page.evaluate(() => { const c = getContract('MK-B2'); return contractSetArchived(c, false); });
    await menuOf('MK-B2');
    await page.click('.pd-menu #ws-end').catch(() => {});
    await until(page, () => !!document.getElementById('end-overlay'));
    await page.click('#end-overlay [data-end="hold"]').catch(() => {});
    const d4 = await dlg();
    ok('4a hold is grey until the reason is written, and says so', !!d4 && d4.grey && d4.go === 'Put on hold' && /Write the reason first/.test(d4.why), JSON.stringify(d4));
    await page.fill('#end-note', 'Dispute over the rebate, referred to our advocate.').catch(() => {});
    const d4b = await dlg();
    ok('4b written, "Put on hold" is live', !!d4b && !d4b.grey, JSON.stringify(d4b));
    await page.click('#end-go').catch(() => {});
    const held = await until(page, () => !document.getElementById('end-overlay') && !!(getContract('MK-B2') || {}).hold);
    ok('4c it is on hold, with its reason', held, await page.evaluate(() => JSON.stringify((getContract('MK-B2') || {}).hold || null)));
    const m4 = await menuOf('MK-B2');
    ok('4d held, the menu offers Release as its own row', m4.hold, JSON.stringify(m4));
    await page.click('.pd-menu #ws-end').catch(() => {});
    await until(page, () => !!document.getElementById('end-overlay'));
    const d4e = await dlg();
    const holdA = d4e && d4e.answers.find(a => a.k === 'hold');
    ok('4e and the door greys "hold" with its reason', !!holdA && holdA.off && /already on hold/.test(holdA.why), JSON.stringify(holdA));
    await page.keyboard.press('Escape');

    /* ===== 5. SIGNED PAPER: DECLINE IS GREY WITH THE ACT'S OWN REASON ===== */
    await menuOf('MK-A1');
    await page.click('.pd-menu #ws-end').catch(() => {});
    await until(page, () => !!document.getElementById('end-overlay'));
    const d5 = await dlg();
    const dec = d5 && d5.answers.find(a => a.k === 'decline');
    ok('5 on signed paper "decline" is grey, with why', !!dec && dec.off && /signed/.test(dec.why), JSON.stringify(dec));
    await page.screenshot({ path: path.join(OUT, '5-signed.png') });

    /* ===== 8. ESC CLOSES IT AND NOTHING CHANGES ===== */
    const before = await page.evaluate(() => JSON.stringify([getContract('MK-A1').status, !!getContract('MK-A1').archived, !!getContract('MK-A1').hold]));
    await page.keyboard.press('Escape');
    const shut = await until(page, () => !document.getElementById('end-overlay'));
    const after = await page.evaluate(() => JSON.stringify([getContract('MK-A1').status, !!getContract('MK-A1').archived, !!getContract('MK-A1').hold]));
    ok('8 Esc closes it and nothing changes', shut && before === after, before + ' → ' + after);

    /* ===== 6. THE CONTRACTS ROW'S ⋯: THE SAME DOOR ===== */
    const row = await page.evaluate(() => {
      const box = document.createElement('div'); box.innerHTML = regRowActsHtml(getContract('MK-A2'));
      return [...box.querySelectorAll('[data-act]')].map(b => b.getAttribute('data-act'));
    });
    ok('6 the Contracts row\'s ⋯ carries End or pause, not the three rows', row.includes('end') && !row.some(k => ['decline', 'archive', 'hold'].includes(k)), JSON.stringify(row));

    /* ===== 7. JAMBO'S WORDS OPEN THE SAME WINDOW, HOLD CHOSEN ===== */
    await page.evaluate(() => { setView('dashboard'); pdOpenOnHome('MK-A2', 'copilot'); });
    await page.waitForTimeout(400);
    await page.evaluate(() => { if (typeof caDoorRun === 'function') return; const g = window.CA_DOOR_GO || null; if (g && g.hold) g.hold(getContract('MK-A2')); else intelAsk('put MK-A2 on hold'); });
    const j = await until(page, () => !!document.getElementById('end-overlay'));
    const d7 = j ? await page.evaluate(() => ((document.querySelector('#end-overlay input[name="end-a"]:checked') || {}).value || '')) : '';
    ok('7 Jambo\'s "put it on hold" opens the one door, hold chosen', j && d7 === 'hold', d7);
    await page.keyboard.press('Escape');

    ok('9 no page errors', errs.length === 0, errs.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    ok('the stage ran to the end', false, e && e.message);
  } finally {
    await browser.close();
    if (h.stop) await h.stop();
  }
  console.log(`\n${pass}/${pass + fail} passed`);
  process.exit(fail ? 1 : 0);
})();
