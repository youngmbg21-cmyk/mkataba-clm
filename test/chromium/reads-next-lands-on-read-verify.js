/* NEXT 50 → ON A READS ROW IS THE PANEL'S DOOR (owner, 29 Oct 2026: "the press on the left main screen still takes
   me to jambo panel with AI brain before it then reverts to the contracts page where the run begins. The press
   highlighted in the panel goes directly to the contracts page and starts the run")

   WHAT THIS PINS, in a real browser against a real server (the stand-in answering the reads)
     1 after a question to Jambo on Reads (his conversation up on its panel), the row's Next 50 → lands on Contracts
       with the panel on Overview from the first frame — never on the conversation — and the read starts
     2 nothing on the way asks Jambo's brain: no /api/ai/ call but the column reads themselves
     3 the words said on Reads are kept (the conversation still holds the question)
   AT THE PARENT 1 fails: the Contracts panel shows the conversation for a few hundred ms, then the read.
   Run: node test/chromium/reads-next-lands-on-read-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const BODY = 'SUPPLY\n\n3. Payment\nPayment is due within thirty days.\n\n9. Termination\nEither party may end this on thirty days notice.';
const Q = 'what does this page tell me about my reads?';

(async () => {
  const h = await startHati();
  await seedWorkspace(h, { contracts: Array.from({ length: 120 }, (_, i) => fixtureContract(`HC-${1001 + i}`, 'Supply Agreement', 'Nandi Dairy', 'proc', 1000000, 'Signed', BODY)) });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  const wait = async (fn, ms = 30000) => { try { await page.waitForFunction(fn, null, { timeout: ms }); return true; } catch (_) { return false; } };
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await wait(() => window.state && state.contracts && state.contracts.length >= 120 && window.regPlaceSet);
    await page.evaluate(() => { regPlaceSet({ show: 'list' }); setView('register'); });
    await wait(() => !!document.querySelector('#reg-tbody tr[data-row]') && window.askColOpen);
    await page.evaluate(() => askColOpen({ question: 'How much notice to end?', name: 'Notice to end' }));
    await wait(() => !!document.querySelector('#ac-form [data-ac-ask]')); await page.click('#ac-form [data-ac-ask]');
    check('0 the stage: the first 50 read', await wait(() => !document.querySelector('#ac-form') && document.querySelectorAll('td.ac-cell .ac-ans:not(.is-wait)').length >= 10, 60000));
    await wait(() => !(window.AC && AC.busy), 20000);

    await page.evaluate(() => setView('reads'));
    await wait(() => !!document.querySelector('#rd-page [data-rd-next]'));
    await page.click('#ins-panel textarea');
    await page.keyboard.type(Q); await page.keyboard.press('Enter');
    check('0b Jambo\'s conversation is up on Reads\' panel, his answer in', await wait(() => state.view === 'reads' && typeof jamboTalkUp === 'function' && jamboTalkUp() && !(window.intel && intel.busy) && (intel.history || []).length >= 2, 15000), await page.evaluate(() => ({ v: state.view, len: (intel.history || []).length })));

    /* a record of every frame from the press until the read runs */
    await page.evaluate(() => { window._frames = []; const t0 = performance.now(); const tick = () => {
      if (state.view === 'dashboard') window._frames.push({ talk: typeof jamboTalkUp === 'function' && jamboTalkUp(), ov: !!document.querySelector('#ig-dock [data-ac-col], #ig-dock .ac-dk-card') });
      if (performance.now() - t0 < 3000) requestAnimationFrame(tick); }; tick(); });
    const ai = []; page.on('request', r => { const u = r.url(); if (/\/api\/ai\//.test(u) && !/\/api\/ai\/column$/.test(u)) ai.push(u.replace(h.base, '')); });
    await page.click('#rd-page [data-rd-next]');
    const ran = await wait(() => state.view === 'dashboard' && !!document.querySelector('#ig-dock .ac-dk-card, #ig-dock [data-ac-stop]'), 10000);
    await page.waitForTimeout(3100);
    const F = await page.evaluate(() => window._frames);
    check('1a the row\'s Next 50 → lands on Contracts and the read starts', ran && F.length > 0, { frames: F.length });
    check('1b never on the conversation, from the first frame', F.length > 0 && !F.some(f => f.talk), { talkFrames: F.filter(f => f.talk).length, of: F.length });
    check('2 nothing on the way asks Jambo\'s brain', ai.length === 0, ai);
    check('3 the words said on Reads are kept', await page.evaluate(q => (intel.history || []).some(m => m && m.role === 'user' && String(m.content || m.text || '').includes(q)), Q));
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
    process.exit(fails ? 1 : 0);
  }
})();
