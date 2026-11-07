/* ONE ROW ABOVE JAMBO'S BOX, EVERYWHERE (owner, 6 Nov 2026: "duplication of links or buttons above the jambo entry fields
   in some cases which should not be the case"). On every place and every contract face, in the new look, at most ONE row
   of links stands above each Jambo box: where the chips are doors (data-ca-chip) they are the row and the flow map's
   doors stand down — on the Contracts place's folders too, which drew both (igCaChipsNote, jamboWaysSync).
     1 · every place: no panel with two rows (a doors row and a chips row, or two doors rows)
     2 · every contract face (document, fill, redline, sign, share, history, brief, next, oblig): the same
     3 · the Contracts folders: the chips (upload · draft · …) are the one row; no doors row
   At the parent 1 and 3 fail (Contracts' folders and wall: both rows).
   Run: node test/chromium/one-row-above-the-box-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const W = require('../round7-world');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const PLACES = ['counter', 'board', 'needs', 'contracts', 'wall', 'list', 'calendar', 'explorer', 'work', 'negotiations', 'approvals', 'oblig', 'requests', 'parties', 'people', 'ourpaper', 'import', 'mynotes', 'reads', 'pulse', 'handbook', 'house', 'settings', 'guide', 'alerts', 'activity'];
const FACES = ['document', 'fill', 'redline', 'sign', 'share', 'history', 'brief', 'next', 'oblig'];
/* every Jambo box on the page: the link rows standing above it (a doors row, or a chips row that carries doors) */
const MEASURE = () => {
  const vis = e => !!(e && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && e.getBoundingClientRect().height > 0);
  const out = [];
  document.querySelectorAll('.jb-card').forEach(card => {
    const foot = card.closest('.igd-foot, .jl-foot, #st-jb-form') || card.parentElement;
    const host = foot && foot.parentElement; if (!host) return;
    const ways = [...host.querySelectorAll(':scope > .jb-ways, :scope > * > .jb-ways')].filter(vis);
    const chips = [...host.querySelectorAll('[data-ig-chips]')].filter(e => vis(e) && e.querySelector('[data-ca-chip]'));
    const words = w => [...w.querySelectorAll('button, a')].map(b => b.textContent.trim()).join('·');
    out.push({ host: host.id || host.className.split(' ')[0], rows: ways.map(w => (w.getAttribute('data-jb-ways') || '?') + ':' + words(w)).concat(chips.map(c => 'chips:' + words(c))) });
  });
  return out;
};

(async () => {
  const h = await startHati();
  await W.seedRound7(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
  page.on('pageerror', e => console.log('PAGE ERROR', String(e).slice(0, 200)));
  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
  await until(page, () => typeof caGo === 'function' && typeof currentUser === 'function' && !!currentUser() && !!getContract('MK-IT'), null, 40000);
  await page.evaluate(W.R7_IN_PAGE);
  await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); });
  const go = async (place, cid) => { await page.evaluate(([k, id]) => { try { if (typeof closeModal === 'function') closeModal(); } catch (_){} caGo({ kind: 'go', place: k, cid: id || null }); }, [place, cid]);
    await until(page, () => !document.querySelector('.ob-spin'), null, 3000); await page.waitForTimeout(900); };
  const dups = [];
  for (const k of PLACES){ await go(k); const m = await page.evaluate(MEASURE); m.filter(x => x.rows.length > 1).forEach(x => dups.push({ where: k, ...x })); }
  check('1 · every place: at most one row above each Jambo box', dups.length === 0, dups);
  const fd = [];
  for (const f of FACES){ await go(f, 'MK-IT'); const m = await page.evaluate(MEASURE); m.filter(x => x.rows.length > 1).forEach(x => fd.push({ where: 'MK-IT:' + f, ...x })); }
  check('2 · every contract face: at most one row above each Jambo box', fd.length === 0, fd);
  await go('contracts');
  /* the list was opened above (regFoldersShut): the folders are brought back the way a person does, with ‹ */
  await page.evaluate(() => { const b = document.querySelector('[data-ctf-back]'); if (b) b.click(); });
  await until(page, () => typeof regFoldersUp === 'function' && regFoldersUp(), null, 8000); await page.waitForTimeout(900);
  const c = await page.evaluate(() => ({ folders: typeof regFoldersUp === 'function' && regFoldersUp(), ways: document.querySelectorAll('#ig-dock .jb-ways:not([hidden])').length, chips: [...document.querySelectorAll('#ig-dock [data-ig-chips] [data-ca-chip]')].map(b => b.getAttribute('data-ca-chip')) }));
  check('3 · the Contracts folders: the chips are the one row, no doors row', c.folders && c.ways === 0 && c.chips.includes('upload') && c.chips.includes('draft'), c);
  await browser.close(); await h.stop();
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
