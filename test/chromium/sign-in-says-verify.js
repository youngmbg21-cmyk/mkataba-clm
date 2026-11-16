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
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): the sign-in is round 8's page (.lin-wrap) — the
       wordmark in the serif, ONE sentence under it saying what HaTi is (.lin-say), the fields as labelled lines, and
       under the form what stays inside the company (.lin-foot); the old card's .li-say/.li-foot are not drawn */
    const S = await P.evaluate(() => {
      const say = document.querySelector('.lin-say'), foot = document.querySelector('.lin-foot'), h1 = document.querySelector('.lin-main h1');
      const lab = document.getElementById('li-email').closest('label').querySelector('span').textContent.trim();
      const between = []; for (let el = h1 && h1.nextElementSibling; el && !el.contains(document.getElementById('li-email')); el = el.nextElementSibling) between.push(el.className);
      return { say: say ? say.textContent.trim() : '', serif: h1 ? getComputedStyle(h1).fontFamily : '', foot: foot ? foot.textContent.trim() : '', lab, between };
    });
    check(/read by Jambo/.test(S.say) && S.say.split(/[.!?](\s|$)/).filter(x => x && x.trim()).length === 1 && /Serif|serif/.test(S.serif), '1 one sentence under the wordmark (in the serif) says what HaTi is', S);
    check(S.lab === 'Work email' && S.between.join() === 'lin-say', '2 Work email, and no second grey line between the wordmark and the form', S);
    check(/^What stays inside .+: the papers, the names, the money\./.test(S.foot), '3 under the form: what stays inside the company', S.foot);
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
