/* A SIGN-IN THAT SAYS WHAT HaTi IS (round 11, "The Legora way", owner's overnight build of 28 Oct 2026)
     1 · one sentence in the serif under the wordmark says what HaTi is
     2 · the form asks for a Work email and a password; no second grey line under its heading
     3 · under the form: what stays inside the company, named
     4 · signing in still works
     5 · the owner's three screens: the column inside the window, nothing sideways
   Run: node test/chromium/sign-in-says-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.SHOTS_OUT || path.join(__dirname, 'shots', 'sign-in-says');
fs.mkdirSync(OUT, { recursive: true });
let failures = 0, passes = 0;
const check = (ok, what, detail) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + what + (detail != null ? ' — ' + JSON.stringify(detail) : '')); if (ok) passes++; else failures++; };
const until = async (P, fn, arg, ms = 8000) => { try { await P.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };

(async () => {
  const h = await startHati({});
  await seedWorkspace(h, { contracts: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const P = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = []; P.on('pageerror', e => errors.push(String(e && e.message || e)));
  try {
    await P.goto(h.base + '/', { waitUntil: 'networkidle' });
    await until(P, () => !!document.getElementById('li-email'), null, 10000);
    const S = await P.evaluate(() => {
      const say = document.querySelector('.li-say'), foot = document.querySelector('.li-foot');
      const lab = document.getElementById('li-email').closest('label').querySelector('span').textContent.trim();
      const h1 = document.querySelector('h1'); const after = h1 && h1.nextElementSibling;
      return { say: say ? say.textContent.trim() : '', serif: say ? getComputedStyle(say).fontFamily : '', foot: foot ? foot.textContent.trim() : '', lab,
        subAfterHead: !!(after && after.tagName === 'P') };
    });
    check(/^Say what you want done\. HaTi takes you there/.test(S.say) && /Serif|serif/.test(S.serif), '1 one sentence in the serif says what HaTi is', S);
    check(S.lab === 'Work email' && !S.subAfterHead, '2 Work email, and no grey line under the heading', S);
    check(/stays inside .+\. The other side sees only the contract\.$/.test(S.foot), '3 under the form: what stays inside the company', S.foot);
    await P.screenshot({ path: path.join(OUT, '1440x780.png') });
    for (const [w, hh] of [[1536, 730], [1366, 950]]){
      await P.setViewportSize({ width: w, height: hh });
      const fit = await P.evaluate(() => ({ side: document.documentElement.scrollWidth > innerWidth, go: (() => { const r = document.getElementById('li-go').getBoundingClientRect(); return r.bottom <= innerHeight && r.top >= 0; })() }));
      check(!fit.side && fit.go, `5 ${w}×${hh}: the column fits, Sign in in view, nothing sideways`, fit);
      await P.screenshot({ path: path.join(OUT, `${w}x${hh}.png`) });
    }
    await P.fill('#li-email', 'admin@example.co.ke'); await P.fill('#li-pass', 'adminpassword1'); await P.click('#li-go');
    check(await until(P, () => !!(window.state && Array.isArray(state.contracts)), null, 15000), '4 signing in still works');
    check(errors.length === 0, 'no page errors', errors.join(' | '));
  } finally { await browser.close(); await h.stop(); }
  console.log(`\n${passes} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
})();
