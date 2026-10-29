/* JAMBO SAYS WHAT HE DID (round 4, "The Legora way", owner's overnight build of 28 Oct 2026)
   After a sentence typed beside the paper moves the reader, Jambo's card at the top of the face he landed on says what
   was said and what he did, with "Not this, go back" and "Change what I said".
     1 · "show me the history of MK-C1" lands on MK-C1's History; his card stands at the top of the panel, quoting the words
     2 · "Change what I said" puts the words back in the box, sends nothing
     3 · "Not this, go back" goes back to where the words were typed (MK-A2's paper), and the card goes
     4 · a sentence that does not move (a question to the brain) draws no card
     5 · the owner's three screens: the card inside the panel, its presses on screen
   Run: node test/chromium/jambo-says-what-he-did-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const { seedHandbookWorld } = require('../handbook-world');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.SHOTS_OUT || path.join(__dirname, 'shots', 'jambo-says-what-he-did');
fs.mkdirSync(OUT, { recursive: true });
let failures = 0, passes = 0;
const check = (ok, what, detail) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + what + (detail != null ? ' — ' + JSON.stringify(detail) : '')); if (ok) passes++; else failures++; };
const until = async (P, fn, arg, ms = 8000) => { try { await P.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const still = P => until(P, () => !document.getAnimations().some(a => a.playState === 'running'), null, 4000);

(async () => {
  const h = await startHati({});
  await seedHandbookWorld(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const P = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = []; P.on('pageerror', e => errors.push(String(e && e.message || e)));
  let brain = 0; P.on('request', r => { if (/\/api\/ai\/(chat|copilot|ask)/.test(r.url())) brain++; });
  const onPaper = id => until(P, id => !!(window.pdContract && pdContract() && pdContract().id === id && window.pdOnPaper && pdOnPaper()), id, 10000);
  try {
    await P.goto(h.base + '/', { waitUntil: 'networkidle' });
    await P.fill('#li-email', 'admin@example.co.ke'); await P.fill('#li-pass', 'adminpassword1'); await P.click('#li-go');
    await until(P, () => !!document.getElementById('cn-q'), null, 20000);
    await P.evaluate(() => { state.aiConfigured = true; pdOpenOnHome('MK-A2', 'copilot'); });
    check(await onPaper('MK-A2'), '0 MK-A2 on the paper');
    await until(P, () => !!document.getElementById('igd-input'), null, 8000);
    const said = 'show me the history of MK-C1';
    await P.fill('#igd-input', said); await P.press('#igd-input', 'Enter');
    const card = await until(P, () => !!document.querySelector('#ig-dock [data-ca-echo]'), null, 8000);
    const C = await P.evaluate(() => { const c = document.querySelector('#ig-dock [data-ca-echo]'); if (!c) return null;
      const r = c.getBoundingClientRect(), at = document.elementFromPoint(r.left + 20, r.top + 12);
      return { text: c.innerText.replace(/\s+/g, ' '), painted: !!(at && c.contains(at)), head: (window.pdHeadWord && pdHeadWord()) || '' }; });
    check(card && C && C.painted && C.text.includes('You said “' + said + '”') && /history of MK-C1/i.test(C.text) && /MK-C1/.test(C.head), '1 his card at the top of the face he landed on, quoting the words', C);
    await still(P); await P.screenshot({ path: path.join(OUT, '1440x780.png') });

    const b0 = brain;
    await P.click('#ig-dock [data-ca-echo] [data-ca-act="reword"]');
    const box = await P.evaluate(() => (document.getElementById('igd-input') || {}).value || '');
    check(box === said && brain === b0, '2 Change what I said puts the words back in the box, sends nothing', { box, calls: brain - b0 });
    await P.fill('#igd-input', '');

    await P.click('#ig-dock [data-ca-echo] [data-ca-act="goback"]');
    const back = await onPaper('MK-A2');
    const gone = await until(P, () => !document.querySelector('#ig-dock [data-ca-echo]'), null, 4000);
    check(back && gone, '3 Not this, go back returns to MK-A2\'s paper and the card goes', { back, gone });

    await P.fill('#igd-input', 'what is the governing law here?'); await P.press('#igd-input', 'Enter');
    await until(P, () => !intel.busy, null, 10000);
    check(!(await P.evaluate(() => !!document.querySelector('#ig-dock [data-ca-echo]'))), '4 a question that moves nothing draws no card');

    /* three screens, on a fresh landing */
    await P.fill('#igd-input', said); await P.press('#igd-input', 'Enter');
    await until(P, () => !!document.querySelector('#ig-dock [data-ca-echo]'), null, 8000);
    for (const [w, hh] of [[1536, 730], [1366, 950]]){
      await P.setViewportSize({ width: w, height: hh }); await P.waitForTimeout(300); await still(P);
      const fit = await P.evaluate(() => { const c = document.querySelector('#ig-dock [data-ca-echo]'), d = document.getElementById('ig-dock');
        if (!c || !d) return { ok: false }; const r = c.getBoundingClientRect(), D = d.getBoundingClientRect();
        const bs = [...c.querySelectorAll('[data-ca-act]')].map(b => b.getBoundingClientRect());
        return { inside: r.left >= D.left && r.right <= D.right + 1, btns: bs.every(b => b.top >= 0 && b.bottom <= innerHeight && b.height < 40), side: document.documentElement.scrollWidth > innerWidth }; });
      check(fit.inside && fit.btns && !fit.side, `5 ${w}×${hh}: the card inside the panel, its presses on screen`, fit);
      await P.screenshot({ path: path.join(OUT, `${w}x${hh}.png`) });
    }
    check(errors.length === 0, 'no page errors', errors.join(' | '));
  } finally { await browser.close(); await h.stop(); }
  console.log(`\n${passes} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
})();
