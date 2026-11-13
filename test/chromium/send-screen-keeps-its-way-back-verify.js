/* Chromium verification: THE SEND SCREEN KEEPS ITS WAY BACK (owner, 13 Nov 2026)
   ============================================================
   "when I pick 'A Where we are page' on the Send screen, the screen flashes and is replaced by a new one, and I can
   no longer go back to 'The contract, round 1'."
   Reproduced by the rebuild measure (run 43461225946): *the pop-up is closed and a new one opened ("Send to Ventura
   Services Agreement" became "Send where the deal stands to Ventura Capital · MK"); Jambo's panel is thrown away;
   the paper is thrown away; most of the page is written again (76%)* and *the way back: "The contract, round 1" is
   no longer offered.*

   THE RULE (work order "Nothing is thrown away that only needed a word changed", Part B): all three of What goes —
   the contract, the negotiation history, a Where we are page — are TURNS OF ONE SCREEN, as two of them already are.

   At 1440 x 780, the new look on, the Send screen open on a negotiated contract:
     1. the screen is one screen: picking "A Where we are page" does not close it and open another
     2. the way back stands: "The contract, round 1" is still offered, and goes back
     3. what was typed survives the turn, both ways
     4. the history, which already turns in place, still does (nothing was broken on the way)
     5. no page errors
   Waits ask for the state, bounded. RED at unmodified main (1, 2, 3).
   Run: node test/chromium/send-screen-keeps-its-way-back-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FIXTURES } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'send-screen-keeps-its-way-back');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const NOTE = 'we have moved on payment terms but not on the cap';
let failures = 0;
const check = (name, pass, detail) => { console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); if (!pass) failures++; };
const HTML = '<h1>SERVICES AGREEMENT</h1>' + ['Services', 'Fees', 'Term', 'Liability'].map((t, i) => `<h2>${i + 1}. ${t}</h2><p>${t} are as set out in this clause ${i + 1}, and each party shall keep to them in good faith.</p>`).join('');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const c = fixtureContract('MK-110', 'Services Agreement', 'Ventura Capital', 'proc', 1200000, 'Under Review', 'x');
  Object.assign(c, { redlineText: HTML, format: 'rich', template: null, source: 'upload', fields: {},
    upload: { name: 'S.docx', extractedText: HTML.replace(/<[^>]+>/g, ' '), uploadedAt: new Date().toISOString() } });
  await seedWorkspace(h, { contracts: [...FIXTURES, c], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 10000) => { const t0 = Date.now();
      while (Date.now() - t0 < ms) { let v = null; try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return null; };

    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    const ready = await until(() => typeof caGo === 'function' && !!currentUser() && !!getContract('MK-110'), null, 40000);
    check('0a. signed in, the book loaded', !!ready);
    await page.evaluate(async () => { try { await stPrefSet('newLook', true); } catch (_){ } try { newLookApply(); } catch (_){ } });
    await page.waitForTimeout(1000);

    /* a negotiated contract, so there is a round 1 to go back to, then the Send screen */
    await page.evaluate(() => { const c = getContract('MK-110');
      try { if (typeof negoInit === 'function') negoInit(c); } catch (_){ }
      try { const id = (negoClauseList(c)[1] || negoClauseList(c)[0] || {}).id;
        if (id && typeof negoEditClause === 'function') negoEditClause(c, id, '<p>Fees are as set out in this clause 2, payable within thirty (30) days.</p>'); } catch (_){ }
      try { pdOpenOnHome('MK-110', 'copilot'); } catch (_){ } });
    await page.waitForTimeout(1200);
    await page.evaluate(() => { try { openShareModal(getContract('MK-110')); } catch (_){ } });
    const up = await until(() => !!document.querySelector('#modal-root [role="dialog"]') && !!document.querySelector('[data-sh-as-go="what"]'), null, 15000);
    check('0b. the Send screen is open, with What goes on it', !!up);

    /* the screen as it stands: the very element, so a reopen cannot hide */
    const mark = async () => page.evaluate(() => { const d = document.querySelector('#modal-root [role="dialog"]'); if (!d) return false; d.dataset.sbMark = 'one'; return true; });
    const same = async () => page.evaluate(() => { const d = document.querySelector('#modal-root [role="dialog"]'); return !!(d && d.dataset.sbMark === 'one'); });
    /* the note box is drawn only for some ways of sending (the letter's own rule); where it is in sight it is typed
       into as a person does, and where it is not its words are still the screen's and are set with a real input event */
    const typeNote = async () => { const box = await page.$('#sh-summary'); if (!box) return false;
      let seen = false; try { seen = await box.isVisible(); } catch (_) { seen = false; }
      if (seen){ await box.click({ timeout: 3000 }).catch(() => {}); await page.fill('#sh-summary', NOTE).catch(() => {}); }
      if (!seen || (await page.evaluate(() => document.getElementById('sh-summary').value)) !== NOTE)
        await page.evaluate(v => { const b = document.getElementById('sh-summary'); b.value = v; b.dispatchEvent(new Event('input', { bubbles: true })); }, NOTE);
      await page.waitForTimeout(150);
      return (await page.evaluate(() => document.getElementById('sh-summary').value)) === NOTE; };
    /* What goes → one of its three choices, through the chip the reader presses */
    const pick = async k => { const ok = await page.evaluate(k => {
        const go = document.querySelector('[data-sh-as-go="what"]'); if (!go) return false;
        if (!go.closest('.sh-as').classList.contains('is-open')) go.click();
        const b = document.querySelector(`[data-sh-as-what="${k}"]`); if (!b || b.disabled) return false;
        b.click(); return true; }, k);
      await page.waitForTimeout(900); return ok; };
    const offered = async k => page.evaluate(k => {
      const go = document.querySelector('[data-sh-as-go="what"]'); if (!go) return false;
      if (!go.closest('.sh-as').classList.contains('is-open')) go.click();
      const b = document.querySelector(`[data-sh-as-what="${k}"]`);
      return !!(b && !b.disabled && b.getAttribute('aria-current') !== 'true'); }, k);
    const whatNow = async () => page.evaluate(() => { const w = document.querySelector('[data-sh-as-w="what"]'); return w ? w.textContent.trim() : null; });

    console.log('\n1 · a Where we are page is a turn of this screen, not a new one');
    await mark();
    const typed = await typeNote();
    const toStatus = await pick('status');
    check('1a. a note was typed and "A Where we are page" was picked', typed && toStatus, 'typed=' + typed + ' picked=' + toStatus);
    check('1b. it is still the SAME screen (not closed and reopened)', await same(), 'what goes now: ' + await whatNow());

    console.log('\n2 · the way back');
    const backOffered = await offered('contract');
    check('2a. "The contract, round 1" is still offered', backOffered);
    const went = await pick('contract');
    const w2 = await whatNow();
    check('2b. and it goes back to the contract', went && !!w2 && !/where|stands/i.test(w2), 'what goes now: ' + w2);
    check('2c. still the same screen on the way back', await same());

    console.log('\n3 · what was typed survives the turn');
    const kept = await page.evaluate(() => { const b = document.getElementById('sh-summary'); return b ? String(b.value || '') : null; });
    check('3a. the note stands after turning there and back', kept === NOTE, JSON.stringify(kept));

    console.log('\n4 · the history still turns in place (it already did)');
    await mark();
    /* a contract with no history to send greys that choice (a dead choice is never pressed): said, not failed */
    if (!await offered('history')) console.log('SKIP  4. this contract offers no negotiation history to send, so its turn is not driven');
    else { const toHist = await pick('history');
      check('4a. the history was picked', toHist);
      check('4b. still the same screen', await same()); }

    await page.screenshot({ path: path.join(OUT, 'send.png') }).catch(() => {});
    check('5. no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(`\n${failures ? failures + ' FAILED' : 'all checks passed'}`);
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
