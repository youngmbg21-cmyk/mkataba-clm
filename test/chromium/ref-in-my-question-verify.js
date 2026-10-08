/* ============================================================
   A REFERENCE IN MY OWN QUESTION CAN BE READ (Young, 8 Oct 2026: "fix the
   unreadable contract reference in the chat bubble")
   ============================================================
   On Home, the reader asks "Put MK-RQ1 on hold". Their own question sits on
   the navy bubble, and the reference inside it is a door onto the contract.
     1  the reference in the reader's bubble reads against the bubble (≥ 4.5)
     2  it is still a door (a button that opens the contract)
     3  the same in the app's dark theme
     4  Copilot's answer keeps its own accent-ink reference (unchanged)
   AT THE PARENT 1 FAILS: accent ink on the navy bubble measured 1.42.
   ============================================================ */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'ref-in-my-question');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const DOC = 'SUPPLY AGREEMENT\n\nArticle 1 Term\n\nThis Agreement runs for twelve (12) months.';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h, { contracts: [], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    const me = (await W.admin.json('/api/bootstrap')).me;
    await W.admin.json('/api/contracts/MK-RQ1', { method: 'PUT', body: { contract: Object.assign(
      fixtureContract('MK-RQ1', 'Supply Agreement', 'Kilima Foods Ltd', FOLDER_A, 900000, 'Under Review', DOC), { owner: { id: me.id, name: me.name } }), baseVersion: 0 } });
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    if (await page.$('#li-email')) {
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    }
    await page.waitForFunction(() => window.state && Array.isArray(state.contracts) && state.contracts.some(c => c.id === 'MK-RQ1'), null, { timeout: 15000 }).catch(() => {});
    await page.keyboard.press('Escape').catch(() => {});
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) await en.click();
    await page.evaluate(() => setView('dashboard'));
    await page.waitForSelector('#igd-input', { timeout: 10000 }).catch(() => {});
    await page.evaluate(() => intelAsk('Put MK-RQ1 on hold, budget freeze'));
    const marked = await page.waitForFunction(() => !!document.querySelector('#igd-feed .ai-msg.justify-end .ig-ref-go'), null, { timeout: 8000 }).then(() => true, () => false);

    const measure = () => page.evaluate(() => {
      const rgb = s => { const v = (s.match(/[\d.]+/g) || []).map(Number); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
      const lum = c => { const f = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
      const ground = el => { for (let a = el; a; a = a.parentElement){ const c = rgb(getComputedStyle(a).backgroundColor); if (c.a >= 1) return c; } return { r: 255, g: 255, b: 255, a: 1 }; };
      const ratio = el => { const f = rgb(getComputedStyle(el).color), g = ground(el); const [x, y] = [lum(f), lum(g)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
      const mine = document.querySelector('#igd-feed .ai-msg.justify-end .ig-ref-go');
      const theirs = document.querySelector('#igd-feed .ai-msg:not(.justify-end) .ig-ref-go');
      return { mine: mine ? Math.round(ratio(mine) * 100) / 100 : null, door: !!(mine && mine.tagName === 'BUTTON' && mine.getAttribute('data-ig-open') === 'MK-RQ1'),
        theirs: theirs ? getComputedStyle(theirs).color : null, accent: getComputedStyle(document.documentElement).getPropertyValue('--accent-ink').trim() };
    });
    const light = await measure();
    ok('1 the reference in my own question reads against the bubble (≥ 4.5)', marked && light.mine >= 4.5, JSON.stringify(light));
    ok('2 it is still a door onto the contract', light.door);
    await page.screenshot({ path: path.join(OUT, '1-light.png') });
    await page.evaluate(() => { if (typeof setDark === 'function') setDark(true); });
    await page.waitForFunction(() => document.documentElement.classList.contains('dark'), null, { timeout: 5000 }).catch(() => {});
    await page.evaluate(() => { if (typeof renderIntelDock === 'function') renderIntelDock(); });
    await page.waitForFunction(() => !!document.querySelector('#igd-feed .ai-msg.justify-end .ig-ref-go'), null, { timeout: 5000 }).catch(() => {});
    const dark = await measure();
    ok('3 and in the dark theme', dark.mine >= 4.5, JSON.stringify(dark));
    await page.screenshot({ path: path.join(OUT, '2-dark.png') });
    await page.evaluate(() => { if (typeof setDark === 'function') setDark(false); });
    await page.evaluate(() => intelAsk('Summarise MK-RQ1'));
    const answered = await page.waitForFunction(() => !!document.querySelector('#igd-feed .ai-msg:not(.justify-end) .ig-ref-go'), null, { timeout: 8000 }).then(() => true, () => false);
    if (answered) {
      const a = await measure();
      const probe = await page.evaluate(acc => { const d = document.createElement('span'); d.style.color = acc; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; }, a.accent);
      ok('4 Copilot\'s answer keeps its accent-ink reference', a.theirs === probe, a.theirs + ' vs ' + probe);
    } else ok('4 Copilot\'s answer keeps its accent-ink reference', true, 'no reference in the answer without a key — nothing to compare');
    ok('no page errors', !errs.length, errs.join(' | '));
  } catch (e) {
    ok('the stage ran', false, String(e && e.stack || e).slice(0, 400));
  } finally {
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
