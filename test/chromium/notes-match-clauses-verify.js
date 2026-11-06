/* THE NOTES BESIDE THE PAPER AGREE WITH CLAUSES (owner picked "The Legora Way", amber kept, 6 Nov 2026)
   The notes world (test/notes-world.js): a lease whose Clauses reading marks six clauses (two need you).
     1 · every clause Clauses marks (needs you or worth a look) has its group beside that clause on the paper, and only those
         carry a Clauses point: the same clauses; the "needs you" lines are the number on the Clauses tab
     2 · the same colour: a Clauses point's dot is the amber the Clauses list draws
     3 · each point one line with its word (Needs you · Worth a look · Not in the contract); its clause's group has
         Open in Clauses
     4 · one group per clause: § 5's needs-you point, worth-a-look point and the risk Jambo found stand together
     5 · many notes: no group overlaps another; a group that drifted folds to its first line and "+ N more here", which opens it
     6 · nothing guessed: the point with no place on the paper is not drawn
     7 · Open in Clauses opens that clause's own row on the Clauses tab
     8 · the switch off: no notes
   At the parent 1–7 fail: only the blanks were drawn.
   Run: node test/chromium/notes-match-clauses-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const W = require('../notes-world');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };

(async () => {
  const h = await startHati(); await W.seedNotes(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', e => console.log('PAGE ERROR', String(e).slice(0, 200)));
  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
  await until(page, () => typeof caGo === 'function' && typeof currentUser === 'function' && !!currentUser() && !!getContract('MK-110'), null, 40000);
  await page.evaluate(W.IN_PAGE, W.BREAKDOWN);
  await until(page, () => !!(getContract('MK-110').breakdown || {}).ok && document.querySelectorAll('#pd-thread .doc-th-row').length > 3, null, 20000);
  await page.waitForTimeout(500);
  const C = await page.evaluate(() => ({ amber: [...document.querySelectorAll('#pd-thread .doc-th-row')].filter(r => /stk-b-(need|look)/.test(r.className)).map(r => r.getAttribute('data-th-row')),
    tabN: Number(((document.querySelector('#ig-dock [data-pd-tab="doc"] .pd-tab-n') || {}).textContent || '').trim()) || (typeof stkNeedCount === 'function' ? stkNeedCount(pdContract()) : null),
    listAmber: getComputedStyle(document.querySelector('#pd-thread .doc-th-row.stk-b-look .doc-th-bead') || document.body).backgroundColor }));
  await page.evaluate(() => { const t = document.querySelector('#ig-dock [data-pd-tab="copilot"]'); if (t) t.click(); });
  await until(page, () => document.querySelectorAll('#pd2-notes .pd2-mg').length >= 6, null, 15000);
  await page.waitForTimeout(600);
  const read = () => page.evaluate(() => [...document.querySelectorAll('#pd2-notes .pd2-mg')].map(g => { const r = g.getBoundingClientRect(); return {
    at: g.getAttribute('data-pd2-at'), h: g.querySelector('.pd2-mg-h').textContent, top: r.top, bottom: r.bottom, folded: g.classList.contains('is-folded'),
    open: !!g.querySelector('[data-pd2-go="clause"]'), more: !!g.querySelector('[data-pd2-unfold]'),
    items: [...g.querySelectorAll('.pd2-mg-i')].map(i => ({ tone: [...i.classList].find(x => /^is-(owe|ask|risk|fact)$/.test(x)), word: (i.querySelector('.pd2-mg-l b') || {}).textContent || '', line: i.querySelector('.pd2-mg-l').textContent,
      dot: getComputedStyle(i.querySelector('.pd2-mn-dot')).backgroundColor })) }; }));
  const G = await read();
  const withPoint = G.filter(g => g.items.some(i => i.word)).map(g => g.at);
  const needs = G.reduce((n, g) => n + g.items.filter(i => i.word === 'Needs you').length, 0);

  check('1 every clause Clauses marks has its group, and only those carry a Clauses point; the needs-you lines are the tab\'s number',
    C.amber.length === 6 && withPoint.join() === C.amber.join() && needs === C.tabN && needs === 2, { amber: C.amber, withPoint, needs, tab: C.tabN });
  const pointDots = [...new Set(G.flatMap(g => g.items.filter(i => i.word).map(i => i.dot)))];
  check('2 the same colour: every Clauses point is the amber of the Clauses list', pointDots.length === 1 && pointDots[0] === C.listAmber, { pointDots, list: C.listAmber });
  check('3 each point one line with its word; its clause\'s group has Open in Clauses', G.some(g => g.items.some(i => i.word)) && G.filter(g => g.items.some(i => i.word)).every(g => g.open && g.items.filter(i => i.word).every(i => /^(Needs you|Worth a look|Not in the contract)$/.test(i.word) && i.line.length > i.word.length + 4)),
    G.map(g => [g.h, g.open, g.items.map(i => i.word)]));
  const liab = G.find(g => /Liability/.test(g.h));
  check('4 one group per clause: § 5 holds its needs-you point, its worth-a-look point and the risk together', !!liab && G.filter(g => /Liability/.test(g.h)).length === 1
    && liab.items.some(i => i.word === 'Needs you') && liab.items.some(i => i.word === 'Worth a look') && liab.items.some(i => i.tone === 'is-risk'), liab);
  const overlap = G.some((g, i) => i && g.top < G[i - 1].bottom - 1);
  const folded = G.find(g => g.folded);
  let opened = false;
  if (folded){ await page.click(`#pd2-notes .pd2-mg[data-pd2-at="${folded.at}"] [data-pd2-unfold]`);
    opened = await until(page, at => { const g = document.querySelector(`#pd2-notes .pd2-mg[data-pd2-at="${at}"]`); return !!g && !g.classList.contains('is-folded') && [...g.querySelectorAll('.pd2-mg-i')].every(i => i.getBoundingClientRect().height > 0); }, folded.at, 5000); }
  const G2 = await read(); const overlap2 = G2.some((g, i) => i && g.top < G2[i - 1].bottom - 1);
  check('5 many notes: none overlap; a drifted group folds to "+ N more here", which opens it in place (and still none overlap)', !overlap && !!folded && opened && !overlap2, { overlap, folded: folded && folded.h, opened, overlap2 });
  check('6 nothing guessed: the point with no place on the paper is not drawn', !G.some(g => g.items.some(i => /No data protection/.test(i.line))));
  /* 7 · Open in Clauses */
  try {
    const at = (G.find(g => /Termination/.test(g.h)) || {}).at;
    await page.click(`#pd2-notes .pd2-mg[data-pd2-at="${at}"] [data-pd2-go="clause"]`);
    const ok = await until(page, at => { const r = document.querySelector(`#pd-thread .doc-th-row[data-th-row="${at}"]`); return !!r && r.classList.contains('is-open'); }, at, 10000);
    check('7 Open in Clauses opens that clause\'s own row on the Clauses tab', ok, { at });
  } catch (e) { check('7 open in clauses', false, String(e).slice(0, 200)); }
  /* 8 · off */
  try {
    await page.evaluate(async () => { await stPrefSet('newLook', false); newLookApply(); pdOpenOnHome('MK-110', 'copilot'); });
    await page.waitForTimeout(1500);
    check('8 the switch off: no notes beside the paper', await page.evaluate(() => !document.querySelector('#pd2-notes .pd2-mg')));
  } catch (e) { check('8 off', false, String(e).slice(0, 200)); }

  await browser.close(); await h.stop();
  console.log(fails ? `\n${fails} FAILED` : '\nall passed');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
