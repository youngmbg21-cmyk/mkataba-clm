/* ============================================================
   ONE JAMBO CONVERSATION EVERYWHERE (owner, 21 Oct 2026: "Jambo keeps ONE
   conversation across the whole app … a question asked on Home, in Settings,
   in the side panel or beside a list all appears in the same conversation
   wherever Jambo is opened"; reverses "a new page or contract is fresh")
   ============================================================
   Driven in a real browser, as an admin:
     1  a question asked in Home's panel is in Settings' panel and in the side
        panel (on a page with no panel of its own), and it says what it read
     2  the reverse: a question asked in Settings' panel is in Home's panel and
        the side panel; one asked in the side panel is on Home and in Settings
     3  ONE PLACE AT A TIME: while Home's panel shows the conversation, no other
        host has a turn drawn
     4  another contract on Home's paper keeps the conversation (nothing fresh)
     5  a Home answer's press shown in the side panel takes you to Home and
        presses there; a Settings answer's press shown on Home goes to Settings
     6  Clear in the side panel clears the one conversation everywhere
     7  the owner's three screens: Home's panel, Settings' panel and the side
        panel photographed with the shared conversation
   AT THE PARENT (cb1aa4ba) 1, 2, 4 and 6 FAIL: three separate conversations.
     node test/chromium/jambo-one-conversation-verify.js
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'jambo-one-conversation');
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
const CONTRACTS = [
  H.fixtureContract('MK-C1', 'Raw Material Supply Agreement', 'Nandi Dairy', H.FOLDER_A, 800000, 'Under Review'),
  H.fixtureContract('MK-C2', 'Office lease', 'Britam Properties', H.FOLDER_B, 4e6, 'Signed'),
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  await H.seedWorkspace(h, { contracts: CONTRACTS, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.message || e).slice(0, 200)));
  /* A WAIT ASKS FOR THE STATE, BOUNDED */
  const until = async (fn, arg, ms = 8000) => { const end = Date.now() + ms;
    while (Date.now() < end) { const v = await page.evaluate(fn, arg).catch(() => null); if (v) return v; await new Promise(r => setTimeout(r, 100)); } return null; };
  const shot = n => page.screenshot({ path: path.join(OUT, n + '.png') }).catch(() => {});
  const txt = sel => page.evaluate(s => { const e = document.querySelector(s); return e ? e.textContent.replace(/\s+/g, ' ') : ''; }, sel);
  const quiet = () => until(() => !(window.intel && intel.busy) && !(window.ai && ai.busy) ? true : null, null, 15000);
  /* Home: the Board, its panel open on the conversation */
  const toHome = async () => {
    await page.evaluate(() => { setView('dashboard'); if (window.hbFace && hbFace() !== 'board') hbSetFace('board'); intel.dockOpen = true; renderIntelDock(); });
    await until(() => !!document.getElementById('igd-input'), null, 8000);
  };
  const homeTalk = async () => { await page.evaluate(() => { if (window.pdTalkReopen) pdTalkReopen(); }); await quiet(); };
  const toSettings = async () => {
    await page.evaluate(() => setView('team'));
    await until(() => !!document.getElementById('st-jb-feed'), null, 8000);
    /* the page may draw again as it settles (a docked panel): reopen until the conversation is up */
    await until(() => { if (window.stTalkReopen) stTalkReopen(); const T = document.querySelector('#st-jb-feed [data-st-jb-talk]'); return T && !T.hidden && window.stTalkShows && stTalkShows() ? true : null; }, null, 6000);
  };
  const toSide = async () => {
    await page.evaluate(() => { setView('brain'); });
    await until(() => state.view === 'brain' ? true : null, null, 6000);
    await page.evaluate(() => openAI());
    await until(() => document.getElementById('ai-panel').classList.contains('open') ? true : null, null, 4000);
  };
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(() => window.state && state.contracts && state.contracts.length >= 2 ? true : null, null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => { if (langId() !== 'en') langSet('en'); });

    /* ===== 1 · ASKED ON HOME ===== */
    await toHome();
    await page.fill('#igd-input', 'QHOME which contracts end soon');
    await page.press('#igd-input', 'Enter');
    await quiet(); await homeTalk();
    const home1 = await until(() => /QHOME/.test((document.getElementById('ig-dock') || {}).textContent || '') ? true : null, null, 8000);
    check('1a the question is in Home\'s panel', !!home1);
    await toSettings();
    const st1 = await until(() => { const f = document.getElementById('st-jb-feed'); return f && /QHOME/.test(f.textContent) ? f.textContent.replace(/\s+/g, ' ').slice(0, 200) : null; }, null, 6000);
    check('1b the same question is in Settings\' panel', !!st1, st1);
    await shot('settings-1440x780');
    await toSide();
    const side1 = await until(() => { const f = document.getElementById('ai-feed'); return f && /QHOME/.test(f.textContent) ? f.textContent.replace(/\s+/g, ' ').slice(0, 300) : null; }, null, 6000);
    check('1c and in the side panel, on a page with no panel of its own', !!side1, side1);
    const read1 = await page.evaluate(() => [...document.querySelectorAll('#ai-feed [data-ai-read]')].map(x => x.textContent.trim()));
    check('1d Home\'s answer says what it read there', read1.some(t => /^Read from/.test(t)), JSON.stringify(read1));
    await shot('side-1440x780');

    /* ===== 2 · THE REVERSE ===== */
    await page.fill('#ai-input', 'QSIDE how many drafts');
    await page.press('#ai-input', 'Enter');
    await quiet();
    await page.evaluate(() => closeAI());
    await toSettings();
    /* RE-POINTED 27 Oct 2026 (owner: "roll out the jambo capabilities from the board's jambo to all the jambos"): the
       settings finder's free answer (its press, part 5) is Overview's; typed on Jambo's tab it would go to the chat */
    await page.evaluate(() => { try { stTalkBack(); } catch (_) {} });
    /* RE-PINNED 28 Oct 2026 ("Door above the box"): the free reader, asked as a chip asks */ await page.fill('#st-jb-q', 'QSET signing limit');
    await H.chipEnter(page, '#st-jb-q');
    const st2 = await until(() => { const f = document.getElementById('st-jb-feed'); return f && /QSET/.test(f.textContent) && /QSIDE/.test(f.textContent) ? true : null; }, null, 6000);
    check('2a in Settings: its own question and the side panel\'s, one conversation', !!st2, (await txt('#st-jb-feed')).slice(0, 300));
    await toHome(); await homeTalk();
    const home2 = await until(() => { const t = (document.getElementById('ig-dock') || {}).textContent || ''; return /QSET/.test(t) && /QSIDE/.test(t) && /QHOME/.test(t) ? true : null; }, null, 6000);
    check('2b on Home: Settings\' and the side panel\'s questions with its own', !!home2, (await txt('#ig-dock')).slice(0, 300));
    await shot('home-1440x780');

    /* ===== 3 · ONE PLACE AT A TIME ===== */
    const places = await page.evaluate(() => ({ dock: document.querySelectorAll('#ig-dock .jb-turn').length,
      side: document.querySelectorAll('#ai-feed .jb-turn, #ai-feed .ai-msg').length, list: document.querySelectorAll('#jl-feed .jb-turn').length,
      ids: (() => { const seen = {}; let dup = 0; document.querySelectorAll('canvas[id]').forEach(c => { if (seen[c.id]) dup++; seen[c.id] = 1; }); return dup; })() }));
    check('3 shown on Home, the conversation is drawn there only; no canvas id twice', places.dock > 0 && !places.side && !places.list && !places.ids, JSON.stringify(places));

    /* ===== 4 · ANOTHER CONTRACT KEEPS IT ===== */
    await page.evaluate(() => pdOpenOnHome('MK-C2', 'copilot'));
    await until(() => window.intel && intel.paper && intel.paper.id === 'MK-C2' ? true : null, null, 8000);
    await homeTalk();
    const paper = await until(() => /QHOME/.test((document.getElementById('ig-dock') || {}).textContent || '') ? true : null, null, 6000);
    check('4 another contract on Home\'s paper keeps the one conversation', !!paper, (await txt('#ig-dock')).slice(0, 200));

    /* ===== 5 · A PRESS AWAY FROM ITS HOST ===== */
    const stBtn = await page.evaluate(() => { const b = document.querySelector('#ig-dock .jb-turn[data-jb-born="st"] button'); return b ? (b.textContent || '').trim() : null; });
    if (stBtn) {
      await page.click('#ig-dock .jb-turn[data-jb-born="st"] button');
      const went = await until(() => state.view === 'team' ? true : null, null, 6000);
      check('5a a Settings answer\'s press shown on Home takes you to Settings and presses there', !!went, stBtn);
    } else check('5a (no Settings answer carried a press to try)', false, (await txt('#ig-dock')).slice(0, 200));
    await toSide();
    const igBtn = await page.evaluate(() => { const b = document.querySelector('#ai-feed .jb-turn[data-jb-born="ig"] button'); return b ? (b.textContent || '').trim() : ''; });
    if (igBtn) {
      await page.click('#ai-feed .jb-turn[data-jb-born="ig"] button');
      const back = await until(() => state.view === 'dashboard' ? true : null, null, 6000);
      check('5b a Home answer\'s press shown in the side panel takes you to Home', !!back, igBtn);
    } else console.log('NOTE  5b Home\'s answers here carried no press to try');

    /* ===== 7 · THE OWNER'S THREE SCREENS ===== */
    for (const [w, ht] of SCREENS) {
      await page.setViewportSize({ width: w, height: ht });
      await toHome(); await homeTalk(); await shot(`home-${w}x${ht}`);
      await toSettings(); await page.waitForTimeout(300); await shot(`settings-${w}x${ht}`);
      await toSide(); await page.waitForTimeout(300); await shot(`side-${w}x${ht}`);
      const side = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
      check(`7 ${w}×${ht}: the three panels photographed, nothing sideways`, side);
      await page.evaluate(() => closeAI());
    }
    await page.setViewportSize({ width: 1440, height: 780 });

    /* ===== 6 · CLEAR, EVERYWHERE ===== */
    await toSide();
    await page.click('#ai-clear');
    await page.evaluate(() => closeAI());
    await toHome(); await homeTalk();
    const gone = await page.evaluate(() => !/QHOME|QSET|QSIDE/.test((document.getElementById('ig-dock') || {}).textContent || '') && intel.history.length === 0);
    await toSettings();
    const gone2 = await page.evaluate(() => !/QHOME|QSET|QSIDE/.test((document.getElementById('st-jb-feed') || {}).textContent || ''));
    check('6 Clear in the side panel clears the one conversation on Home and in Settings', gone && gone2, JSON.stringify({ gone, gone2 }));
  } catch (e) {
    check('the stage ran', false, String(e && e.stack || e).slice(0, 400));
  } finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
    process.exit(failures ? 1 : 0);
  }
})();
