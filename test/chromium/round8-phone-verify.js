/* THE NEW LOOK, ROUND 8 SECOND HALF: THE PHONE (2 Nov 2026; the review room's drawing, behind the admin's own switch).
     1 · Off: the phone is today's — the company's mark in the bar, "What do you need" and its list
     2 · On, Home as drawn: the black bar with HaTi and your initials; the greeting and one sentence that counts the
         rows drawn under it (the computer's one desk); each row the agreement, a line, one underlined act word;
         Jambo's box under the list
     3 · A row opens its contract under its own black bar (back, the agreement, its state), the tabs kept, the sheet
         under the paper with the six stops and the sentence in bold
     4 · Back goes to Contracts, as it always has (mBack)
   At the parent (before this half) 2–4 fail: none of it exists.
   Run: node test/chromium/round8-phone-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const W = require('../round7-world');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };

(async () => {
  const h = await startHati(); await W.seedRound7(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const p = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  p.on('pageerror', e => console.log('PAGE ERROR', String(e).slice(0, 200)));
  await p.goto(h.base + '/', { waitUntil: 'networkidle' });
  await p.fill('#li-email', 'admin@example.co.ke'); await p.fill('#li-pass', 'adminpassword1'); await p.click('#li-go');
  await until(p, () => typeof currentUser === 'function' && !!currentUser() && !!document.querySelector('#m-root .m-screen'), null, 40000);

  /* 1 · off */
  try {
    await until(p, () => !!document.querySelector('#m-root .m-head-mark'), null, 10000);
    const S = await p.evaluate(() => ({ mark: !!document.querySelector('#m-root .m-head-mark'), nl: !!document.querySelector('#m-root .m-nl-home'), rows: document.querySelectorAll('#m-root .m-needs .m-row').length }));
    check('1 off: the phone as today', S.mark && !S.nl && S.rows > 0, S);
  } catch (e) { check('1 off', false, String(e).slice(0, 200)); }

  /* 2 · on, Home */
  try {
    await p.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); mGo('home'); });
    const up = await until(p, () => document.querySelectorAll('#m-root .m-nl-row').length >= 3, null, 15000);
    const S = up ? await p.evaluate(() => {
      const kids = [...document.querySelector('#m-root .m-nl-home').children].map(e => e.className);
      return { bar: (document.querySelector('#m-root .m-nl-bar') || {}).innerText || '', hello: (document.querySelector('.m-nl-hello') || {}).textContent || '',
        say: (document.querySelector('.m-nl-say') || {}).textContent || '', rows: document.querySelectorAll('.m-nl-row').length,
        acts: [...document.querySelectorAll('.m-nl-row .m-nl-act')].length, askAfter: kids.findIndex(k => /m-nl-ask/.test(k)) > kids.findIndex(k => /m-nl-list/.test(k)) };
    }) : null;
    /* RE-POINTED (the harmony review, ONE COUNT, owner's yes 9 Nov 2026): with more than one kind the sentence leads with
       the whole ("7 wait on you: 1 thing is late, 5 are your move and I prepared 1"); the whole is the rows drawn and the
       parts after the colon add up to it */
    const sum = t => (String(t).match(/\d+/g) || []).reduce((a, n) => a + Number(n), 0);
    const lead = S ? /^(\d+)[^:]*:\s*(.*)$/.exec(S.say) : null;
    const counted = !S ? -1 : lead ? (Number(lead[1]) === sum(lead[2]) ? Number(lead[1]) : -2) : sum(S.say);
    check('2a the black bar: HaTi and your initials', !!S && /HaTi/.test(S.bar) && /AO/.test(S.bar), S && S.bar);
    check('2b the greeting and one sentence that counts the rows drawn; each row one act word; Jambo\'s box under the list', !!S && /^Good (morning|afternoon|evening), Amina\.$/.test(S.hello)
      && counted === S.rows && S.acts === S.rows && S.askAfter, S && Object.assign({ counted }, S));
  } catch (e) { check('2 on', false, String(e).slice(0, 200)); }

  /* 3 · a row opens its contract */
  try {
    const name = await p.evaluate(() => { const r = [...document.querySelectorAll('.m-nl-row')].find(x => /Raw Milk Collection/.test(x.textContent)) || document.querySelector('.m-nl-row'); r.click(); return r.querySelector('.m-nl-nm').textContent; });
    const up = await until(p, () => !!document.querySelector('#m-root .m-nl-cbar') && !!document.querySelector('#m-root .m-nl-sheet'), null, 15000);
    const S = up ? await p.evaluate(() => ({ bar: document.querySelector('.m-nl-cbar').innerText, mark: !!document.querySelector('#m-root .m-nl-bar, #m-root .m-head-mark'),
      tabs: document.querySelectorAll('.m-nl-ctabs .m-ctab').length, road: ((document.querySelector('.m-nl-road') || {}).textContent || '').split(' · ').length,
      now: (document.querySelector('.m-nl-road b') || {}).textContent || '', guide: (document.querySelector('.m-nl-guide') || {}).textContent || '' })) : null;
    check('3 a row opens its contract under its own black bar; tabs kept; the sheet with six stops and the sentence', !!S && S.bar.includes(name) && !S.mark && S.tabs === 5 && S.road === 6 && !!S.now && S.guide.trim().length > 5, S);
  } catch (e) { check('3 contract', false, String(e).slice(0, 200)); }

  /* 4 · back */
  try {
    await p.click('.m-nl-cbar [data-m-act="back"]');
    check('4 back goes to Contracts, as it always has', await until(p, () => mS().screen === 'contracts' && !document.querySelector('#m-root .m-nl-cbar'), null, 10000));
  } catch (e) { check('4 back', false, String(e).slice(0, 200)); }

  await browser.close(); await h.stop();
  console.log(fails ? `\n${fails} FAILED` : '\nall passed');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
