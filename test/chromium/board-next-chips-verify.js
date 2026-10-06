/* Chromium verification: THE NEXT QUESTIONS CAN BE READ ON THE BOARD'S DARK
   SCREEN (Young, 6 Oct 2026, over a Dig deeper card whose "Next:" buttons
   were dark green on the dark stage: "in dark mode, these buttons … are not
   visible")
   ============================================================
     1. on the board's Dark screen a next-question button's words stand off
        the dark card (contrast ≥ 4.5 against the card's own colour), and so
        does its dashed edge (≥ 3);
     2. on the Light screen the same, against white;
     3. the Copilot panel's own buttons keep the platform's colours;
     4. no page errors.
   The buttons are drawn in the markup the Dig deeper card writes, inside a
   real card. Run: node test/chromium/board-next-chips-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'board-next-chips');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const BOOK = [];
for (let k = 0; k < 8; k++){ const c = fixtureContract('MK-' + (700 + k), 'Agreement ' + k, ['Juno AB', 'Baltic Oy'][k % 2], k % 2 ? 'proc' : 'sales', 1e6 * (k + 1), k % 3 ? 'Signed' : 'Draft'); BOOK.push(c); }
/* the markup the Dig deeper card writes for its next questions */
const NXS = "return '<div class=\"hb-nx\"><span class=\"hb-nx-l\">Next:</span><button type=\"button\" class=\"hb-nx-q\" data-hb-next=\"x\">' + q + '</button></div>';";
const results = [];
const check = (name, pass, detail) => { results.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
/* contrast of an rgb(a) colour laid over a solid background */
const rgb = s => (String(s).match(/[\d.]+/g) || []).map(Number);
const over = (fg, bg) => { const [r, g, b, a = 1] = rgb(fg); const [R, G, B] = bg; return [r * a + R * (1 - a), g * a + G * (1 - a), b * a + B * (1 - a)]; };
const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
/* the card colours of each screen, laid over the stage's darkest and lightest */
const CARD = { dark: over('rgba(4,25,26,.82)', [2, 16, 17]), light: over('rgba(255,255,255,.62)', [255, 255, 255]) };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: BOOK, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(ids => window.state && state.contracts && ids.every(id => state.contracts.some(c => c.id === id)), BOOK.map(c => c.id), { timeout: 20000 });
    await page.evaluate(() => { const s = hbS(); s.face = 'board'; s.prep = 'closed'; s.panels = []; s.path = []; s.digBig = false; s.recipe = {}; hbSave(); setView('dashboard'); });
    await page.waitForFunction(() => !!document.getElementById('hb-board'), null, { timeout: 15000 });
    await page.evaluate(async () => { intel.history = []; await intelAsk('contracts by stage'); });
    await page.waitForFunction(() => !!document.querySelector('#hb-board [data-hb-read-more]'), null, { timeout: 10000 });
    for (const scr of ['dark', 'light']){
      await page.click(`[data-hb-screen="${scr}"]`);
      await page.waitForFunction(scr => { const p = document.getElementById('hb-page') || document.getElementById('ig-page'); return p && p.classList.contains('hb-' + scr) && document.querySelector('#hb-board [data-hb-read-more]'); }, scr, { timeout: 8000 });
      const m = await page.evaluate(NXS => { const NX = new Function('q', NXS);
        const host = document.querySelector('#hb-board [data-hb-read-more]').closest('div').parentElement;
        const d = document.createElement('div'); d.innerHTML = NX('Which specific contracts drove the September spike?'); host.appendChild(d);
        const q = d.querySelector('.hb-nx-q'); q.scrollIntoView({ block: 'center' });
        const r = q.getBoundingClientRect(), hit = document.elementFromPoint(r.left + 6, r.top + r.height / 2), cs = getComputedStyle(q);
        return { color: cs.color, edge: cs.borderTopColor, style: cs.borderTopStyle, width: cs.borderTopWidth, painted: !!hit && (hit === q || q.contains(hit)) };
      }, NXS);
      const tc = ratio(over(m.color, CARD[scr]), CARD[scr]), ec = ratio(over(m.edge, CARD[scr]), CARD[scr]);
      check(`${scr === 'dark' ? 1 : 2}a ${scr} screen: the button is painted where it stands`, m.painted, JSON.stringify(m));
      check(`${scr === 'dark' ? 1 : 2}b ${scr} screen: its words stand off the card (≥ 4.5)`, tc >= 4.5, tc.toFixed(2) + ' ' + m.color);
      check(`${scr === 'dark' ? 1 : 2}c ${scr} screen: its dashed edge is drawn and seen (≥ 3)`, m.style === 'dashed' && parseFloat(m.width) >= 1 && ec >= 3, ec.toFixed(2) + ' ' + m.edge);
      await page.screenshot({ path: path.join(OUT, `next-chips-${scr}.png`) });
    }
    const dock = await page.evaluate(NXS => { const NX = new Function('q', NXS); const d = document.createElement('div'); d.innerHTML = NX('by stage'); document.body.appendChild(d);
      const q = d.querySelector('.hb-nx-q'), c = getComputedStyle(q).color; d.remove(); return c; }, NXS);
    const ink = await page.evaluate(() => { const p = document.createElement('span'); p.style.color = 'var(--accent-ink,var(--color-accent-700))'; document.body.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c; });
    check('3 outside the board the buttons keep the platform\'s accent ink', dock === ink, dock + ' / ' + ink);
    check('4 no page errors', !errors.length, JSON.stringify(errors));
  } finally { await browser.close(); await h.stop(); }
  const failed = results.filter(r => !r.pass).length;
  console.log(failed ? `${failed} of ${results.length} failed` : `${results.length}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
