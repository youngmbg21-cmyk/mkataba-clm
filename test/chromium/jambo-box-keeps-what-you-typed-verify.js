/* Chromium verification: A HALF-TYPED QUESTION IS NOT LOST (owner, 13 Nov 2026, the flash survey)
   ============================================================
   "a press that should only change the words rebuilds the whole page instead" — measured by the rebuild measure
   (run 43461225946): a question half typed into Jambo's box is lost on nearly every press of his panel's own
   controls, on every page that has the panel.

   THE RULE (work order "Nothing is thrown away that only needed a word changed", Part A): the draft question is a
   FACT WITH ONE HOME. Only a press that USES it may empty the box. Folding the panel, popping it out, minimizing
   it, closing it, turning to another face, or opening the ✦ window must all give the words back.

   At 1440 x 780, signed in, the new look on, standing on the Board:
     1. type, press Collapse panel, open the panel again — the words stand
     2. type, press ✦ (the chat window) — the words stand
     3. type, ✦ then Minimize — the words stand
     4. type, ✦ then Close — the words stand
     5. type on a paper's Dossier, turn to Clauses and back — the words stand
     6. type, then ASK — the box is empty, because the press used the words (the one press that may empty it)
     7. no page errors
   Waits ask for the state, bounded. RED at unmodified main (1-5): the words live in the box element and die with it.
   Run: node test/chromium/jambo-box-keeps-what-you-typed-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FIXTURES } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'jambo-box-keeps-what-you-typed');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const WORDS = 'what does clause 4 say about liability';
let failures = 0;
const check = (name, pass, detail) => { console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); if (!pass) failures++; };
const HTML = '<h1>SERVICES AGREEMENT</h1>' + ['Services', 'Fees', 'Term', 'Liability'].map((t, i) => `<h2>${i + 1}. ${t}</h2><p>${t} are as set out in this clause ${i + 1}, and each party shall keep to them in good faith.</p>`).join('');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const paper = fixtureContract('MK-110', 'Services Agreement', 'Ventura Capital', 'proc', 1200000, 'Under Review', 'x');
  Object.assign(paper, { redlineText: HTML, format: 'rich', template: null, source: 'upload', fields: {},
    upload: { name: 'S.docx', extractedText: HTML.replace(/<[^>]+>/g, ' '), uploadedAt: new Date().toISOString() } });
  await seedWorkspace(h, { contracts: [...FIXTURES, paper], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    /* THE WINDOW IN THE PAGE IS WHAT THIS FILE PRESSES THE ✦ FOR (14 Nov 2026): where the browser keeps a window on top the ✦ opens Jambo popped out (ai.js aiStarPress, f1049), so this page is a browser without one, as Safari and Firefox are */
    await page.addInitScript(() => { try { Object.defineProperty(window, 'documentPictureInPicture', { configurable: true, writable: true, value: undefined }); } catch (_) {} });
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 10000) => { const t0 = Date.now();
      while (Date.now() - t0 < ms) { let v = null; try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return null; };

    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    const ready = await until(() => typeof caGo === 'function' && !!currentUser() && !!getContract('MK-110'), null, 40000);
    check('0. signed in, the book loaded', !!ready);
    await page.evaluate(async () => { try { await stPrefSet('newLook', true); } catch (_){ } try { newLookApply(); } catch (_){ } });
    await page.waitForTimeout(1200);

    /* the panel, open, with its box on screen */
    const openPanel = async () => {
      await page.evaluate(() => { try { if (window.intel && !intel.dockOpen){ intel.dockOpen = true; renderIntelDock(); igSyncDockWidth(); } } catch (_){ } });
      return !!(await until(() => !!document.getElementById('igd-input'), null, 8000));
    };
    /* type into the box the way a person does: a trusted input event */
    const type = async () => {
      if (!await openPanel()) return false;
      await page.click('#igd-input');
      await page.fill('#igd-input', '');
      await page.type('#igd-input', WORDS, { delay: 8 });
      await page.waitForTimeout(150);
      return (await page.inputValue('#igd-input')) === WORDS;
    };
    /* what the box says now, after the panel has been brought back */
    const words = async () => { await openPanel();
      return await page.evaluate(() => { const n = document.getElementById('igd-input'); return n ? String(n.value || '') : null; }); };
    const press = async sel => { const el = await page.$(sel); if (!el) return false;
      try { await el.click({ timeout: 2500 }); } catch (_){ try { await page.evaluate(s => document.querySelector(s)?.click(), sel); } catch (_e){ return false; } }
      await page.waitForTimeout(500); return true; };
    const board = async () => { await page.evaluate(() => { try { caGo({ kind: 'go', place: 'board' }); } catch (_){ } }); await page.waitForTimeout(900); };

    console.log('\n1 · fold the panel and open it again');
    await board();
    const t1 = await type();
    const p1 = await press('#igd-collapse');
    check('1a. the words were typed, and Collapse panel was pressed', t1 && p1);
    check('1b. the words stand after folding and opening again', (await words()) === WORDS, JSON.stringify(await words()));

    console.log('\n2 · the ✦ window');
    await board();
    const t2 = await type();
    const p2 = await press('#cmd-ai');
    check('2a. the words were typed, and ✦ was pressed', t2 && p2);
    check('2b. the words stand once ✦ is open', (await words()) === WORDS, JSON.stringify(await words()));
    await press('#ai-close');

    console.log('\n3 · ✦ then Minimize');
    await board();
    const t3 = await type();
    await press('#cmd-ai');
    const p3 = await press('#ai-min');
    check('3a. the words were typed, ✦ and Minimize were pressed', t3 && p3);
    check('3b. the words stand after Minimize', (await words()) === WORDS, JSON.stringify(await words()));

    console.log('\n4 · ✦ then Close');
    await board();
    const t4 = await type();
    await press('#cmd-ai');
    const p4 = await press('#ai-close');
    check('4a. the words were typed, ✦ and Close were pressed', t4 && p4);
    check('4b. the words stand after Close', (await words()) === WORDS, JSON.stringify(await words()));

    console.log('\n5 · a paper: the Dossier, to Clauses and back');
    await page.evaluate(() => { try { pdOpenOnHome('MK-110', 'copilot'); } catch (_){ } });
    await page.waitForTimeout(1500);
    const t5 = await type();
    const toTab = async k => { const ok = await page.evaluate(k => { const b = document.querySelector(`#ig-dock [data-pd-tab="${k}"]`); if (!b) return false; b.click(); return true; }, k);
      await page.waitForTimeout(900); return ok; };
    const p5 = await toTab('doc') && await toTab('copilot');
    check('5a. the words were typed on the Dossier, and the tabs were pressed', t5 && p5);
    check('5b. the words stand after Clauses and back', (await words()) === WORDS, JSON.stringify(await words()));

    console.log('\n6 · the one press that MAY empty the box: asking');
    await board();
    const t6 = await type();
    const asked = await page.evaluate(() => { const n = document.getElementById('igd-input'); if (!n) return false;
      n.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); return true; });
    await page.waitForTimeout(1200);
    const after = await page.evaluate(() => { const n = document.getElementById('igd-input'); return n ? String(n.value || '') : ''; });
    check('6a. the words were typed and Enter was pressed', t6 && asked);
    check('6b. asking empties the box — a press that USES the words may', after === '' || after !== WORDS, JSON.stringify(after));

    await page.screenshot({ path: path.join(OUT, 'panel.png') }).catch(() => {});
    check('7. no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(`\n${failures ? failures + ' FAILED' : 'all checks passed'}`);
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
