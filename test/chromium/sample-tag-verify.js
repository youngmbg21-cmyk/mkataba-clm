/* THE DEMO SHOWS THE PRODUCT WORKING (round 16, "The Legora way", owner's overnight build of 28 Oct 2026)
     1 · a sample contract (stamped `seeded`) wears a quiet "Sample" tag beside its name on the Contracts list; one of
         the company's own wears none
     2 · the tag is never cut by a long name: it stays whole inside its cell, the name takes the "…"
     3 · Settings' Demo & sample data still names them and removes them all (its count matches the tags)
     4 · the owner's three screens: nothing sideways
   Run: node test/chromium/sample-tag-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.SHOTS_OUT || path.join(__dirname, 'shots', 'sample-tag');
fs.mkdirSync(OUT, { recursive: true });
let failures = 0, passes = 0;
const check = (ok, what, detail) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + what + (detail != null ? ' — ' + JSON.stringify(detail) : '')); if (ok) passes++; else failures++; };
const until = async (P, fn, arg, ms = 8000) => { try { await P.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const DOC = '1. TERM\nThis Agreement runs for twelve (12) months.';

(async () => {
  const h = await startHati({});
  const long = 'Exclusive Regional Distribution and Cold Chain Logistics Services Master Agreement for East Africa';
  await seedWorkspace(h, { approvalRules: [], contracts: [
    Object.assign(fixtureContract('MK-S1', long, 'Nandi Dairy Cooperative Society of Kenya Limited', FOLDER_A, 100000, 'Signed', DOC), { seeded: true }),
    Object.assign(fixtureContract('MK-S2', 'Office Lease', 'Sameer Park', FOLDER_A, 50000, 'Signed', DOC), { seeded: true }),
    fixtureContract('MK-O1', 'Our Own Supply Agreement', 'Kabras Sugar', FOLDER_A, 70000, 'Signed', DOC) ] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const P = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = []; P.on('pageerror', e => errors.push(String(e && e.message || e)));
  const read = () => P.evaluate(() => {
    const rows = [...document.querySelectorAll('tr')].filter(tr => /MK-S1|MK-S2|MK-O1/.test(tr.innerText));
    return rows.map(tr => { const id = (/MK-[SO]\d/.exec(tr.innerText) || [''])[0]; const t = tr.querySelector('.reg-sample'); const cell = tr.querySelector('.reg-cell-title');
      const r = t && t.getBoundingClientRect(), C = cell && cell.getBoundingClientRect(), chip = t && t.querySelector('.ls-chip');
      return { id, tag: t ? t.innerText.trim() : '', whole: !!(chip && chip.scrollWidth <= chip.clientWidth + 1), inside: !!(r && C && r.right <= C.right + 1 && r.left >= C.left) }; });
  });
  try {
    await P.goto(h.base + '/', { waitUntil: 'networkidle' });
    await P.fill('#li-email', 'admin@example.co.ke'); await P.fill('#li-pass', 'adminpassword1'); await P.click('#li-go');
    await until(P, () => !!(window.state && Array.isArray(state.contracts) && state.contracts.length === 3), null, 20000);
    await P.evaluate(() => setView('register'));
    await until(P, () => [...document.querySelectorAll('tr')].some(tr => /MK-S1/.test(tr.innerText)), null, 10000);
    const R = await read();
    const s1 = R.find(r => r.id === 'MK-S1'), s2 = R.find(r => r.id === 'MK-S2'), o1 = R.find(r => r.id === 'MK-O1');
    check(!!(s1 && s2 && o1) && s1.tag === 'Sample' && s2.tag === 'Sample' && o1.tag === '', '1 the samples wear "Sample"; the company\'s own wears none', R);
    check(!!s1 && s1.whole && s1.inside, '2 a long name never cuts the tag', s1);
    await P.screenshot({ path: path.join(OUT, '1440x780.png') });
    const n = await P.evaluate(() => (typeof stSampleContracts === 'function') ? stSampleContracts().length : -1);
    check(n === 2, '3 Settings\' Demo & sample data counts the same two', { n });
    for (const [w, hh] of [[1536, 730], [1366, 950]]){
      await P.setViewportSize({ width: w, height: hh }); await P.waitForTimeout(300);
      const r2 = await read(); const side = await P.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      const a = r2.find(r => r.id === 'MK-S1');
      check(!side && !!a && a.whole && a.inside, `4 ${w}×${hh}: the tag whole inside its cell, nothing sideways`, { side, a });
      await P.screenshot({ path: path.join(OUT, `${w}x${hh}.png`) });
    }
    check(errors.length === 0, 'no page errors', errors.join(' | '));
  } finally { await browser.close(); await h.stop(); }
  console.log(`\n${passes} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
})();
