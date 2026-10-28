/* ============================================================
   JAMBO AS RECOMMENDED, PART 2 (owner, 21 Oct 2026: "build the chatbot as
   recommended" — answers that point, a prepared press, standing watches from
   a sentence; and "What am I looking at?" named the Brain on Jambo's agents)
   ============================================================
   Driven in a real browser, as an admin, in the side panel:
     1  "What am I looking at?" on Jambo's agents names Jambo's agents (never
        the Brain), free — no AI call
     2  an answer about ONE contract carries Show me › and one prepared press
        (ONE builder jpHtml); Show me › lands on that contract's paper on Home
        and lights it; the prepared press opens its act's own door and SENDS
        NOTHING (no share, no mail)
     3  "tell me when Nandi Dairy replies" proposes a watch as a card; nothing
        is stored until Start watching is pressed; then the server holds it
     4  "my watches" lists it; Pause pauses it on the server; Delete removes it
     5  no page errors; nothing spent on any of it
   AT THE PARENT (e332b81b) 2a–4c FAIL (8): jpHtml, the watch card and
   /api/me/watches do not exist. 1 passes there when the chip's reading is
   asked directly; it pins that the page is named from deskPageName.
     node test/chromium/jambo-watches-and-presses-verify.js
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'jambo-watches-and-presses');
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const CONTRACTS = [
  H.fixtureContract('MK-S1', 'Raw Material Supply Agreement', 'Nandi Dairy', H.FOLDER_A, 800000, 'Under Review'),
  H.fixtureContract('MK-S2', 'Office lease', 'Britam Properties', H.FOLDER_B, 4e6, 'Signed'),
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  const W = await H.seedWorkspace(h, { contracts: CONTRACTS, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    const ai = [], sends = [];
    page.on('request', r => { const u = r.url();
      /* a model call; the usage meter and the settings read cost nothing */
      if (/\/api\/ai\//.test(u) && !/\/api\/ai\/(usage|config)\b/.test(u)) ai.push(u.replace(/^.*\/api\//, ''));
      if (r.method() === 'POST' && /\/api\/(shares|contracts\/[^/]+\/chase|mail)/.test(u)) sends.push(u.replace(/^.*\/api\//, '')); });
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(100); }
      return v; };
    const shot = n => page.screenshot({ path: path.join(OUT, n + '.png') }).catch(() => {});
    const has = name => page.evaluate(n => typeof window[n] === 'function', name);
    const watchesOnServer = async () => (await W.admin.json('/api/me/watches').catch(() => ({ watches: null }))).watches;

    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length === 2, null, { timeout: 20000 });
    await page.keyboard.press('Escape').catch(() => {});

    /* ===== 1 · WHAT AM I LOOKING AT, ON JAMBO'S AGENTS ===== */
    await page.evaluate(() => setView('jambo'));
    await until(() => document.querySelector('[data-jh-jambo]') ? true : null, null, 10000);
    const aiBefore = ai.length;
    const here = (await has('aiHereExplain')) ? await page.evaluate(() => {
      aiHereExplain();
      const last = [...document.querySelectorAll('#ai-feed .ai-bub')].pop();
      return { said: last ? last.textContent.replace(/\s+/g, ' ').trim() : '', page: (typeof deskPageName === 'function') ? deskPageName() : '' };
    }) : null;
    check('1 "What am I looking at?" on Jambo\'s agents names it, never the Brain, and spends nothing',
      !!here && /Jambo.s agents/i.test(here.said) && !/\bBrain\b/.test(here.said) && ai.length === aiBefore, JSON.stringify(here));

    /* ===== 2 · SHOW ME › AND THE ONE PREPARED PRESS ===== */
    const okP = await has('jpPressOf') && await has('jpHtml');
    const turn = okP ? await page.evaluate(() => {
      const p = jpPressOf({ ids: ['MK-S1'], q: 'how is the Nandi Dairy supply deal going?', text: 'MK-S1 is under review.' });
      if (!p) return { none: true };
      aiPush('assistant', { text: 'MK-S1 — Raw Material Supply Agreement with Nandi Dairy is under review.', press: p });
      renderAIFeed();
      const row = [...document.querySelectorAll('#ai-feed [data-jp-row]')].pop();
      return { show: !!(row && row.querySelector('[data-jp="show"]')), act: row && row.querySelector('[data-jp="act"]') ? row.querySelector('[data-jp="act"]').textContent.trim() : null };
    }) : null;
    check('2a an answer about one contract carries Show me › and one prepared press', !!turn && turn.show && !!turn.act, JSON.stringify(turn));
    await shot('2-press-row-1440x780');
    if (turn && turn.show){
      await page.click('#ai-feed [data-jp-row]:last-of-type [data-jp="show"]').catch(() => page.evaluate(() => [...document.querySelectorAll('#ai-feed [data-jp="show"]')].pop().click()));
      const landed = await until(() => {
        const paper = document.querySelector('#ig-paper'); const lit = document.querySelector('.is-landed, .is-landed-held');
        const p = (typeof pdContract === 'function') ? pdContract() : null;
        return paper && p && String(p.id) === 'MK-S1' && lit ? { id: p.id, lit: lit.className } : null; }, null, 10000);
      check('2b Show me › lands on that contract\'s paper on Home and lights it', !!landed, JSON.stringify(landed));
      await shot('2-show-me-landed-1440x780');
    } else check('2b Show me › lands on that contract\'s paper on Home and lights it', false, 'no Show me');
    if (turn && turn.act){
      const sendsBefore = sends.length;
      /* RE-POINTED 24 Oct 2026 (ONE CONVERSATION, one place at a time; the one-window merge #463): landed on
         Home's paper, the conversation is Home's panel's — one press on its Jambo tab — not the side panel's */
      /* RE-POINTED 28 Oct 2026 ("Door above the box"): no Jambo tab — the conversation is turned to as an answer turns it
         (pdTalkReopen), as "Jambo ›" above the box opens it */
      await page.evaluate(() => { if (!document.querySelector('#ig-dock [data-jp="act"]') && typeof pdTalkReopen === 'function') pdTalkReopen(); });
      const actIn = await until(() => document.querySelector('#ig-dock [data-jp="act"]') ? true : null, null, 4000);
      if (actIn) await page.evaluate(() => [...document.querySelectorAll('#ig-dock [data-jp="act"]')].pop().click());
      else check('2c0 the prepared press is in Home\'s panel, in the conversation', false, 'not found');
      await page.waitForTimeout(800);
      check('2c the prepared press opens its act and sends nothing by itself', sends.length === sendsBefore, JSON.stringify(sends.slice(sendsBefore)));
      for (let i = 0; i < 3; i++) await page.keyboard.press('Escape').catch(() => {});
    } else check('2c the prepared press opens its act and sends nothing by itself', false, 'no press');

    /* ===== 3 · A WATCH FROM A SENTENCE ===== */
    await page.evaluate(() => setView('jambo'));
    await until(() => document.querySelector('[data-jh-jambo]') ? true : null, null, 10000);
    const said = (await has('watchAskHere')) ? await page.evaluate(() => {
      if (typeof aiSideToggle === 'function' && !document.getElementById('ai-panel').classList.contains('open')) aiSideToggle();
      return watchAskHere('tell me when Nandi Dairy replies');
    }) : false;
    const card = said ? await until(() => { const b = [...document.querySelectorAll('#ai-feed [data-jp-wstart]')].pop();
      return b ? { text: b.closest('.jp-watch').textContent.replace(/\s+/g, ' ').trim(), off: b.disabled } : null; }, null, 4000) : null;
    const before = await watchesOnServer();
    check('3a "tell me when Nandi Dairy replies" proposes a watch card; nothing stored yet',
      !!card && !card.off && /Nandi Dairy|MK-S1/.test(card.text) && Array.isArray(before) && before.length === 0, JSON.stringify({ card, before }));
    await shot('3-watch-card-1440x780');
    if (card) await page.evaluate(() => [...document.querySelectorAll('#ai-feed [data-jp-wstart]')].pop().click());
    let after = null; for (let i = 0; i < 40; i++){ after = await watchesOnServer(); if (after && after.length) break; await page.waitForTimeout(150); }
    check('3b Start watching stores ONE watch on the server, a reply watch on MK-S1',
      !!after && after.length === 1 && after[0].kind === 'reply' && String(after[0].contractId) === 'MK-S1', JSON.stringify(after));

    /* ===== 4 · YOUR WATCHES: PAUSE, DELETE ===== */
    if (await has('watchAskHere')) await page.evaluate(() => watchAskHere('my watches'));
    const row = await until(() => document.querySelector('#ai-feed [data-jp-wrow] [data-jp-wpause]') ? true : null, null, 5000);
    check('4a "my watches" lists it with Pause and Delete', !!row);
    await shot('4-your-watches-1440x780');
    if (row) await page.evaluate(() => [...document.querySelectorAll('#ai-feed [data-jp-wpause]')].pop().click());
    let paused = null; for (let i = 0; i < 40; i++){ const L = await watchesOnServer(); paused = L && L[0] && L[0].paused; if (paused) break; await page.waitForTimeout(150); }
    check('4b Pause pauses it on the server', paused === true, String(paused));
    await until(() => document.querySelector('#ai-feed [data-jp-wdel]') ? true : null, null, 3000);
    await page.evaluate(() => { const b = [...document.querySelectorAll('#ai-feed [data-jp-wdel]')].pop(); if (b) b.click(); });
    let gone = null; for (let i = 0; i < 40; i++){ gone = await watchesOnServer(); if (gone && !gone.length) break; await page.waitForTimeout(150); }
    check('4c Delete removes it', Array.isArray(gone) && gone.length === 0, JSON.stringify(gone));

    /* ===== 5 ===== */
    check('5a nothing spent: no AI route was called', ai.length === 0, ai.join(', ') || null);
    check('5b no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || null);
  } catch (e) {
    check('the run completed', false, e && e.stack ? e.stack.split('\n').slice(0, 3).join(' ') : String(e));
  } finally {
    await browser.close().catch(() => {});
    await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
