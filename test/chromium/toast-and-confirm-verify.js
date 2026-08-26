/* THREE FIXES OFF THE 25 Aug 2026 UI AUDIT, MEASURED IN A REAL BROWSER.
   See UI-UX-AUDIT-AND-ROADMAP.md §2 — all three were found by a UI audit and
   none of them is a design fault.

   WHY THIS FILE IS A BROWSER FILE AND NOT A NODE TEST. Every claim here is
   something only a real browser can answer: whether a string became an ELEMENT
   or stayed text, what a computed z-index resolves to once a compiled Tailwind
   class and an id rule have fought, and what a focused <button> does when
   somebody presses Enter. jsdom resolves no cascade and dispatches no default
   button activation, so it would pass on the broken code for two of the three.

   PROVED AGAINST THE OLD CODE BEFORE IT WAS TRUSTED: with index.html and
   js/core.js stashed, this file reports 11 of 15 failed — the <img> really is
   created, window.__XSS really is set, the visible message truncates to
   "Karibu tena, " because the browser ate the rest as markup, Enter on Cancel
   really returns true, and the toast really sits at 60 under a panel at 100. */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (n, c, d) => { c ? pass++ : fail++; console.log((c ? '  ok   ' : '  FAIL ') + n + (d ? '  → ' + d : '')); };

(async () => {
  const srv = await startHati();
  const b = await chromium.launch({ executablePath: EXEC });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(srv.base);
  await p.waitForTimeout(1200);

  /* ---- 1 · the message is escaped -------------------------------------
     117 of 635 toast() calls interpolate a STORED value — a member's own
     display name, a signer, a workspace name typed at setup. The payload
     below is the exact shape a hostile display name takes. */
  console.log('\n1 · toast() escapes its message');
  const r1 = await p.evaluate(() => {
    const root = document.getElementById('toast-root');
    root.innerHTML = '';
    window.toast('Karibu tena, <img src=x onerror="window.__XSS=1">', 'ok');
    const el = root.firstElementChild;
    return { html: el ? el.innerHTML : '', text: el ? el.textContent : '', imgs: root.querySelectorAll('img').length };
  });
  await p.waitForTimeout(350);
  ok('the message creates no <img> element', r1.imgs === 0, 'imgs=' + r1.imgs);
  ok('the onerror never fires', (await p.evaluate(() => !!window.__XSS)) === false);
  ok('the whole message still reads to a person',
     r1.text.includes('Karibu tena, <img src=x onerror='), JSON.stringify(r1.text.slice(0, 52)));
  ok('escaped, not stripped', r1.html.includes('&lt;img'));
  ok('an ordinary message is untouched',
     (await p.evaluate(() => { const r = document.getElementById('toast-root'); r.innerHTML = '';
       window.toast('Round 3 published — sent to Saw Sawa Ltd', 'ok');
       return r.firstElementChild.textContent; })).includes('Round 3 published'));

  /* ---- 2 · Enter answers the focused button, not the dialog ------------ */
  console.log('\n2 · confirmDialog: Enter answers what is focused');
  const askAndPress = async (focusId, key) => {
    const res = p.evaluate(() => window.confirmDialog({ title: 'Delete this contract?', ok: 'Delete' }));
    await p.waitForTimeout(400);
    if (focusId) await p.evaluate(id => document.getElementById(id).focus(), focusId);
    await p.keyboard.press(key);
    await p.waitForTimeout(300);
    return res;
  };
  ok('Enter with Cancel focused returns FALSE', (await askAndPress('cf-cancel', 'Enter')) === false);
  ok('Enter with Delete focused still returns TRUE', (await askAndPress('cf-ok', 'Enter')) === true);
  ok('Escape still cancels', (await askAndPress(null, 'Escape')) === false);

  /* ---- 3 · the toast is on the ladder and is announced ----------------- */
  console.log('\n3 · toast root: layer and live region');
  const r3 = await p.evaluate(() => {
    const root = document.getElementById('toast-root');
    const ai = document.getElementById('ai-panel');
    if (ai) ai.classList.add('docked');
    const aiZ = ai ? getComputedStyle(ai).zIndex : '0';
    const z = getComputedStyle(root).zIndex;
    if (ai) ai.classList.remove('docked');
    return { z, aiZ, above: Number(z) > Number(aiZ), stale: root.className.includes('z-[60]'),
             role: root.getAttribute('role'), live: root.getAttribute('aria-live'),
             atomic: root.getAttribute('aria-atomic') };
  });
  ok('z-index reads --z-toast', r3.z === '110', 'z=' + r3.z);
  ok('the compiled z-[60] class is gone', r3.stale === false);
  /* THE RELATION, NOT THE NUMBER: what matters is that the confirmation
     channel outranks the layer that raises it. #ai-panel.docked covers the
     whole right edge including the toast's own corner. */
  ok('above the docked Copilot panel', r3.above, 'toast ' + r3.z + ' vs panel ' + r3.aiZ);
  ok('role=status', r3.role === 'status');
  ok('aria-live=polite', r3.live === 'polite');
  ok('aria-atomic=false', r3.atomic === 'false');

  console.log('\n' + (errs.length ? 'PAGE ERRORS: ' + errs.join(' | ') : 'no page errors'));
  console.log(pass + ' passed, ' + fail + ' failed');
  await b.close();
  await srv.stop();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS:', e.message); process.exit(2); });
