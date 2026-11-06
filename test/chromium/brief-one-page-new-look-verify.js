/* THE NEW LOOK: EVERY BRIEF DOOR LANDS ON THE ONE BRIEF PAGE (owner, 6 Nov 2026: "Hati is giving me two types of
   brief. The old version … and the new version … What is going on?"). The new look draws the brief in the middle
   (pd2BriefOpen); Write the brief, Jambo's "brief", the Board's strip, the arrival card and the Scan panel still opened
   the old side panel, through the one door they all press (openCheckPanel(c,'brief')).
     1 · No brief yet, Jambo's brief door (from the Board): the paper comes first, then the new page in the middle,
         saying it is not written and offering Write the brief — never the old side panel
     2 · Write the brief (Jambo's call stood in for) draws the brief on the same page, with what it rests on
     3 · A brief door pressed again while the page is up keeps it up (it is a door that opens, not a switch)
     4 · The new look off: the same door opens the old side panel, as before
   At the parent 1–3 fail: the old side panel opens.
   Run: node test/chromium/brief-one-page-new-look-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const W = require('../round7-world');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };

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
  /* no brief kept on MK-IT; Jambo's call stood in for: it writes a brief resting on the paper's own words */
  await page.evaluate(async () => {
    const c = getContract('MK-IT'); if (window.ensureFull) await ensureFull(c); delete c._brief; delete c._hasBrief;
    window.runContractBrief = async cc => { const live = getContract(cc.id) || cc;
      live._brief = { v: 1, at: new Date().toISOString(), by: 'Jambo', truncated: false, data: { overview: 'A software service for parcel tracking, paid yearly.',
        money: { value: 'A yearly subscription fee.' }, term: { end: 'Runs for a year and renews.' }, watchouts: [], unusual: [] } };
      return live._brief; };
    await stPrefSet('newLook', true); newLookApply();
  });
  const S = () => page.evaluate(() => ({
    mid: !!document.querySelector('[data-pd-mid^="brief:MK-IT"] .pd2-br-sheet'),
    write: !!document.querySelector('[data-pd-mid^="brief:MK-IT"] [data-pd2-br-write]'),
    lines: document.querySelectorAll('[data-pd-mid^="brief:MK-IT"] .pd2-br-ln').length,
    lead: ((document.querySelector('[data-pd-mid^="brief:MK-IT"] .pd2-br-lead') || {}).textContent || '').trim().slice(0, 60),
    old: !!document.querySelector('#side-panel #brief-section'),
    paper: !!(window.pdContract && pdContract() && pdContract().id === 'MK-IT')
  }));

  /* 1 · from the Board, Jambo's brief door */
  await page.evaluate(() => { caGo({ kind: 'go', place: 'board' }); });
  await page.waitForTimeout(600);
  await page.evaluate(() => caBriefOpen(getContract('MK-IT')));
  await until(page, () => !!document.querySelector('[data-pd-mid^="brief:MK-IT"] .pd2-br-sheet') || !!document.querySelector('#side-panel #brief-section'), null, 15000);
  const s1 = await S();
  check('1 · no brief yet: the paper first, then the new page with Write the brief — not the old side panel', s1.mid && s1.write && s1.paper && !s1.old, s1);

  /* 2 · Write the brief */
  if (s1.write) await page.click('[data-pd-mid^="brief:MK-IT"] [data-pd2-br-write]');
  await until(page, () => document.querySelectorAll('[data-pd-mid^="brief:MK-IT"] .pd2-br-ln').length > 0, null, 10000);
  const s2 = await S();
  check('2 · Write the brief draws it on the same page', s2.mid && !s2.write && s2.lines >= 2 && /parcel tracking/.test(s2.lead) && !s2.old, s2);

  /* 3 · pressed again while up: stays up */
  await page.evaluate(() => openCheckPanel(getContract('MK-IT'), 'brief'));
  await page.waitForTimeout(800);
  const s3 = await S();
  check('3 · a brief door pressed while the page is up keeps it up', s3.mid && !s3.old, s3);

  /* 4 · the new look off: the old side panel, as before */
  await page.evaluate(async () => { pdMidClose(); await stPrefSet('newLook', false); newLookApply(); openCheckPanel(getContract('MK-IT'), 'brief'); });
  await until(page, () => !!document.querySelector('#side-panel #brief-section'), null, 8000);
  const s4 = await S();
  check('4 · the new look off: the old side panel, as before', s4.old && !s4.mid, s4);

  await browser.close(); await h.stop();
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
