/* WHAT JAMBO COULD NOT PLACE BECOMES A LESSON (round 8 "The SAP way", owner's yes 29 Oct 2026: no names, 90 days),
   driven where the reader looks:
     1 · a sentence typed in Home's box that no free reader moves, then the person goes to Obligations themselves:
         the sentence is kept, with the page it was typed on and where they went
     2 · words followed by Jambo's own move are not kept
     3 · Settings › Company › What Jambo could not place: the row, Teach, "It means" Obligations, Teach Jambo
     4 · the taught words typed again move to Obligations at once, with no Jambo call
     5 · the owner's three screens: the panel's table fits, nothing sideways */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');
const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'jambo-lessons');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const WORDS = 'renewals coming up';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
    const errors = []; page.on('pageerror', e => errors.push(String(e && e.message || e)));
    const until = async (fn, arg, ms = 10000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(() => !!document.getElementById('cn-q') && window.state && state.contracts && state.contracts.length > 0, null, 30000);
    const rows = () => page.evaluate(async () => { const r = await api('jambo/unplaced'); return (r && r.rows) || []; });

    /* ---- 1 typed, not placed, then the person's own move ---- */
    await page.fill('#cn-q', WORDS); await page.press('#cn-q', 'Enter');
    await page.waitForTimeout(1200);
    await page.evaluate(() => setView('obligations'));
    await until(() => state.view === 'obligations');
    let kept = null;
    for (let i = 0; i < 20 && !kept; i++){ await page.waitForTimeout(250); kept = (await rows()).find(r => r.text === WORDS) || null; }
    check('1 typed, not placed, then the person went to Obligations: the sentence is kept with the page and where they went',
      !!kept && /^(counter|dashboard)$/.test(kept.page) && kept.next === 'obligations' && !('by' in kept) && !('user' in kept), kept);

    /* ---- 2 Jambo's own move keeps nothing ---- */
    await page.evaluate(() => setView('counter')); await until(() => !!document.getElementById('cn-q'));
    await page.evaluate(() => { jamboUnplacedNote('words he then answered by moving'); caGo({ kind: 'go', place: 'calendar' }); });
    await page.waitForTimeout(1500);
    check('2 words followed by Jambo\'s own move are not kept', !(await rows()).some(r => r.text === 'words he then answered by moving'));

    /* ---- 3 Settings: the row, Teach ---- */
    await until(() => { if (!document.getElementById('set-page')) { setView('team'); return false; }
      if (settingsTab() !== 'company') { settingsGoTab('company'); return false; } return true; }, null, 15000);
    await page.evaluate(() => stDrawerOpen('lessons'));
    const row = await until(w => [...document.querySelectorAll('#st-lessons [data-ls-row]')].some(r => r.textContent.includes(w)), WORDS, 10000);
    check('3a Settings › What Jambo could not place lists the sentence, where it was typed and where they went', row);
    await page.screenshot({ path: path.join(OUT, 'panel-1440x780.png') });
    const id = kept && kept.id;
    if (id){
      await page.click(`[data-ls-teach="${id}"]`);
      await until(i => !!document.querySelector(`[data-ls-place="${i}"]`), id, 4000);
      const pre = await page.evaluate(i => document.querySelector(`[data-ls-place="${i}"]`).value, id);
      check('3b Teach opens under its row, the page they went to chosen already', pre === 'oblig', pre);
      await page.selectOption(`[data-ls-place="${id}"]`, 'oblig');
      await page.click(`[data-ls-save="${id}"]`);
      const taught = await until(w => [...document.querySelectorAll('#st-lessons-taught .st-ls-said')].some(e => e.textContent.includes(w)), WORDS, 6000);
      check('3c Teach Jambo: the phrase moves to Taught and its row is gone', taught && !(await rows()).some(r => r.text === WORDS));
    } else check('3b Teach', false, 'no row to teach');

    /* ---- 4 the taught words move free ---- */
    await page.evaluate(() => { try { stDrawerClose(); } catch (_) {} setView('counter'); });
    await until(() => !!document.getElementById('cn-q'));
    const c0 = h.ai.calls.length;
    await page.fill('#cn-q', WORDS); await page.press('#cn-q', 'Enter');
    const moved = await until(() => state.view === 'obligations', null, 6000);
    await page.waitForTimeout(500);
    check('4 the taught words typed again move to Obligations at once, with no Jambo call', moved && h.ai.calls.length === c0, { view: await page.evaluate(() => state.view), calls: h.ai.calls.length - c0 });

    /* ---- 5 the owner's three screens ---- */
    await page.evaluate(async () => { await api('jambo/unplaced', 'POST', { text: 'who owns the kenya power deal and when does it end', page: 'register', ref: 'MK-B2', next: 'directory' }); });
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]){
      await page.setViewportSize({ width: w, height: ht });
      await until(() => { if (!document.getElementById('set-page')) { setView('team'); return false; } if (settingsTab() !== 'company') { settingsGoTab('company'); return false; } return true; }, null, 15000);
      await page.evaluate(() => stDrawerOpen('lessons'));
      await until(() => document.querySelectorAll('#st-lessons [data-ls-row]').length > 0, null, 8000);
      await page.waitForTimeout(400);
      const fit = await page.evaluate(() => { const side = document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1;
        const r = document.querySelector('#st-lessons [data-ls-row]'), a = r && r.querySelector('.st-ls-acts'); const rr = r && r.getBoundingClientRect(), ar = a && a.getBoundingClientRect();
        const btns = a ? [...a.querySelectorAll('button')].every(b => b.scrollWidth <= b.clientWidth + 1 && b.getBoundingClientRect().height < 40) : false;
        return { side, inside: !!(rr && ar && ar.right <= rr.right + 1 && ar.left >= rr.left - 1), btns }; });
      check(`5 ${w}×${ht}: the table fits — its buttons whole on one line, inside the row, nothing sideways`, fit.side && fit.inside && fit.btns, fit);
      await page.screenshot({ path: path.join(OUT, `panel-${w}x${ht}.png`) });
    }
    check('no page errors', !errors.length, errors.join(' | '));
  } finally { await browser.close(); await h.stop(); }
  console.log(`\n${fails ? fails + ' FAILED' : 'ALL PASS'}`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
