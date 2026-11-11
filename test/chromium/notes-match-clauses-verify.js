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
  /* 5b · SHOW LESS (owner, 11 Nov 2026): the opened group folds back, and "+ N more here" stands again */
  try {
    const at = folded ? folded.at : null; const sel = `#pd2-notes .pd2-mg[data-pd2-at="${at}"]`;
    const has = at != null && await page.evaluate(q => { const b = document.querySelector(q + ' [data-pd2-fold]'); return !!b && b.getBoundingClientRect().height > 0 && /Show less/.test(b.textContent); }, sel);
    let back = false;
    if (has){ await page.click(sel + ' [data-pd2-fold]');
      back = await until(page, q => { const g = document.querySelector(q); const m = g && g.querySelector('[data-pd2-unfold]'), l = g && g.querySelector('[data-pd2-fold]');
        return !!g && g.classList.contains('is-folded') && !!m && m.getBoundingClientRect().height > 0 && !!l && l.getBoundingClientRect().height === 0
          && [...g.querySelectorAll('.pd2-mg-i.is-more')].every(i => i.getBoundingClientRect().height === 0); }, sel, 5000); }
    const G3 = await read(); const overlap3 = G3.some((g, i) => i && g.top < G3[i - 1].bottom - 1);
    check('5b an opened group says "Show less"; pressed, it folds to its first line and "+ N more here" (none overlap)', has && back && !overlap3, { has, back, overlap3 });
  } catch (e) { check('5b show less', false, String(e).slice(0, 200)); }
  /* 9 · THE × ON JAMBO'S GREY CARD (owner, 11 Nov 2026): the card goes, the reader stays on the same contract */
  try {
    const drawn = await page.evaluate(() => { if (typeof intel !== 'object' || !intel || !Array.isArray(intel.history)) return 'no history';
      /* a real move's record (what caAct writes when typed words move the reader), then the panel as it lands */
      const a = { kind: 'go', place: 'history', cid: 'MK-110', state: 'ready', said: 'show me history for contract 110', from: null }; intel.history.push({ role: 'user', text: a.said }, { role: 'assistant', text: caGoSay(a), act: a }); if (typeof pdTalkClose === 'function') pdTalkClose(); renderIntelDock();
      const x = document.querySelector('.ca-echo-top .jb-say-x'); if (!x) return document.querySelector('.ca-echo-top') ? 'card without x' : 'no card';
      const cr = x.closest('.jb-say').getBoundingClientRect(), r = x.getBoundingClientRect();
      return { right: cr.right - r.right, top: r.top - cr.top, w: r.width, hit: document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === x || x.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)) }; });
    let gone = false, stays = false;
    if (drawn && drawn.hit){ await page.click('.ca-echo-top .jb-say-x');
      gone = await until(page, () => !document.querySelector('.ca-echo-top'), null, 5000);
      stays = await page.evaluate(() => { if (typeof renderIntelDock === 'function') renderIntelDock(); return !document.querySelector('.ca-echo-top') && String((pdContract() || {}).id) === 'MK-110'; }); }
    check('9 the grey card has a × top right; pressed, the card is gone, stays gone on a repaint, and the contract is the same', !!drawn && drawn.hit === true && drawn.right >= 8 && drawn.right <= 24 && drawn.top >= 8 && drawn.top <= 24 && gone && stays, { drawn, gone, stays });
  } catch (e) { check('9 the x on the card', false, String(e).slice(0, 200)); }
  /* 10 · ASK JAMBO WITH THE PANEL FOLDED (owner, 11 Nov 2026: "nothing happens"): the panel opens, the words are in the box */
  try {
    await page.evaluate(() => { intel.dockOpen = false; renderIntelDock(); if (typeof igSyncDockWidth === 'function') igSyncDockWidth(); });
    const foldedNow = await until(page, () => !!document.getElementById('igd-expand'), null, 5000);
    const menu = foldedNow && await page.evaluate(() => { const el = document.querySelector('#ig-canvas [data-anchor]'); if (!el) return 'no clause';
      const r = document.createRange(); r.selectNodeContents(el); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      if (typeof caSelOpen !== 'function') return 'no caSelOpen'; caSelOpen();
      const b = [...document.querySelectorAll('.nego-selmenu button')].find(x => /Ask Jambo/.test(x.textContent)); if (!b) return 'no menu'; const br = b.getBoundingClientRect(); return { x: br.left + br.width / 2, y: br.top + br.height / 2 }; });
    if (menu && menu.x){ await page.mouse.click(menu.x, menu.y); }
    const openNow = !!(menu && menu.x) && await until(page, () => intel.dockOpen === true && !document.getElementById('igd-expand') && !!document.getElementById('igd-input')
      && /^About/.test(document.getElementById('igd-input').value) && document.getElementById('igd-input').getBoundingClientRect().width > 100, null, 8000);
    check('10 the panel folded: Ask Jambo over selected words opens it with the words in his box, nothing sent', foldedNow && !!(menu && menu.x) && openNow, { foldedNow, menu, openNow });
  } catch (e) { check('10 ask jambo folded', false, String(e).slice(0, 200)); }
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
