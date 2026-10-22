const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const { seedNavWorld } = require('../nav-world');
(async () => {
  const h = await startHati({}); await seedNavWorld(h);
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const P = await (await b.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  await P.goto(h.base + '/', { waitUntil: 'networkidle' });
  await P.fill('#li-email', 'admin@example.co.ke'); await P.fill('#li-pass', 'adminpassword1'); await P.click('#li-go');
  await P.waitForFunction(() => !!(window.currentUser && currentUser() && state.contracts && state.contracts.length), null, { timeout: 20000 });
  await P.evaluate(() => { setView('dashboard'); pdOpenOnHome('MK-Z9', 'copilot'); }); await P.waitForTimeout(1500);
  for (const q of JSON.parse(process.argv[2])){
    await P.evaluate(() => { setView('dashboard'); pdOpenOnHome('MK-Z9', 'copilot'); }); await P.waitForTimeout(1200);
    await P.fill('#igd-input', q); await P.press('#igd-input', 'Enter'); await P.waitForTimeout(2500);
    const r = await P.evaluate(() => JSON.stringify({ view: state.view, face: hbS().face, regUp: typeof regPlaceUp === 'function' ? regPlaceUp() : null, paperUp: typeof igPaperUp === 'function' ? igPaperUp() : null, ct: !!document.getElementById('ct-place'), cid: (pdContract()||{}).id, landed: [...document.querySelectorAll('.is-landed')].map(x => x.id || x.className).slice(0,3) }));
    console.log(q, '=>', r); await P.screenshot({ path: '/tmp/claude-0/-home-user-mkataba-clm/91667584-4949-59f1-9db9-1d21d66a941d/scratchpad/np-' + q.replace(/\W+/g, '_') + '.png' });
  }
  await b.close(); await h.stop();
})().catch(e => { console.error(e); process.exit(1); });
