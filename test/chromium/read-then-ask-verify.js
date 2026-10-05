/* Chromium verification: READ, THEN ASK, AND MAKE SMALLER (Young picked
   "Read, then ask" by name; "build it and merge to main", 4 Oct 2026)
   ============================================================
   On Home's board, the owner's own card — the whole book, by month signed,
   counted:
     1. at normal size the corner button says Make bigger, arrows out, and the
        chart keeps its own line; no reading is drawn;
     2. enlarged, the button says Make smaller (to a screen reader too), its
        arrows point in, the Copilot panel steps aside, and HaTi's reading
        (teal) opens the card in place of the trend line's arithmetic;
     3. a number in the reading opens exactly the contracts it counts;
     4. "What could explain this?" asks Copilot once; the answer lands in the
        amber box under the reading, a sentence with a count this chart does
        not hold is left out and the box says so, and the press is not
        offered again;
     5. Make smaller brings the card back and the panel returns;
     6. a kept view, enlarged, wears the same button;
     7. the board's Light screen, photographed; no page errors.
   Copilot's answer is a stub (no key in CI); everything else is the app.
   Dates are built from today. Waits ask for the state, bounded.
   Screenshots go to test/chromium/shots/read-then-ask/.
   Run: node test/chromium/read-then-ask-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FIXTURES } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'read-then-ask');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const dayIn = (months, day) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + months); d.setDate(day);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
/* the owner's picture in small: 4 signed long ago, nothing for many months,
   then 11 and 14 in the last two closed months */
const SIGNED = [];
const add = (id, signed) => { const c = fixtureContract(id, 'Supply ' + id, 'Juno AB', 'proc', 1e6, 'Signed'); c.signedAt = signed; SIGNED.push(c); };
for (let k = 0; k < 4; k++) add('MK-E' + k, dayIn(-30 - k, 10));
for (let k = 0; k < 11; k++) add('MK-J' + k, dayIn(-3, 3 + k));
for (let k = 0; k < 14; k++) add('MK-A' + k, dayIn(-2, 3 + k));
/* three signed long ago that end within weeks: Ending in 90 days and the
   Renewals panel (which counts agreements in force) have something to read
   (stage 8) */
const dayOff = n => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const SOON = [20, 30, 40].map((n, k) => { const c = fixtureContract('MK-S' + k, 'Service ' + k, 'Nordkraft AB', 'proc', 2e6, 'Signed'); c.signedAt = dayIn(-40, 10); c.expiry = dayOff(n); return c; });
const BOOK = FIXTURES.concat(SIGNED, SOON);
const KEY = 'q:contracts by month signed';

/* amber: red high, green middling, blue low — read from rgb() or from the
   color(srgb …) a color-mix() computes to */
const isAmber = c => { const m = /rgba?\((\d+), (\d+), (\d+)/.exec(c) || /color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)/.exec(c); if (!m) return false;
  const k = /srgb/.test(c) ? 255 : 1, [r, g, b] = [m[1], m[2], m[3]].map(x => Number(x) * k); return r > 200 && g > 130 && g < 200 && b < 110; };
const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: BOOK, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  const btnOf = sel => page.evaluate(s => { const b = document.querySelector(s); if (!b) return null;
    return { title: b.getAttribute('title'), aria: b.getAttribute('aria-label'), pressed: b.getAttribute('aria-pressed'), path: (b.querySelector('path') || {}).getAttribute ? b.querySelector('path').getAttribute('d') : '' }; }, sel);
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    /* the card's own contracts are in (the workspace's fixtures may be filtered by scope) */
    await page.waitForFunction(ids => window.state && state.contracts && ids.every(id => state.contracts.some(c => c.id === id)), SIGNED.map(c => c.id), { timeout: 20000 });
    await page.evaluate(k => {
      window._asked = [];
      window.copilotAvailable = () => true;
      window.copilotAsk = async (msgs) => { window._asked.push(msgs[0].content); await new Promise(r => setTimeout(r, 300));
        return { answer: 'Signing came in a late burst: 25 contracts landed in two months. 22 contracts were imported in one day. Worth checking which of the open ones are close to signing.' }; };
      const s = hbS(); s.face = 'board'; s.prep = 'closed'; s.panels = []; s.why = {}; s.digBig = false; s.path = [k]; s.screen = 'dark';
      s.recipe = s.recipe || {}; s.recipe[k] = { which: 'all', pic: 'cols', split: { by: 'date', unit: 'm', date: 'signed' }, measure: 'count', trend: true };
      hbSave(); setView('dashboard'); }, KEY);
    const up = await until(() => !!document.querySelector('#hb-focus .hb-dig [data-hb-digbig]'));
    if (!up){ check('1a the card is on the board', false, 'no card'); throw new Error('no card'); }

    /* ================= 1. AT REST ================= */
    const b1 = await btnOf('#hb-focus [data-hb-digbig]');
    const r1 = await page.evaluate(() => ({ read: !!document.querySelector('#hb-focus .hb-read'), note: ((document.querySelector('#hb-focus .hb-chart-note') || {}).textContent || '') }));
    check('1a at rest the button says Make bigger, arrows out', b1 && b1.title === 'Make bigger' && b1.aria === 'Make bigger' && b1.pressed === 'false' && /^M2 6V2h4/.test(b1.path), JSON.stringify(b1));
    /* one burst after a long quiet is not a trend (4 Oct 2026): at rest the
       card says why in its own note, and no reading is drawn */
    check('1b and the card is as it was: no reading; the chart\'s own note says why there is no line', !r1.read && /Not enough history yet for a trend/.test(r1.note), JSON.stringify(r1));

    /* ================= 2. ENLARGED ================= */
    await page.click('#hb-focus [data-hb-digbig]');
    const big = await until(() => document.querySelector('#hb-focus .hb-dig.is-big') && document.querySelector('#hb-focus .hb-read') ? true : null);
    const b2 = await btnOf('#hb-focus [data-hb-digbig]');
    check('2a enlarged, the button says Make smaller, arrows in — to the hand and a screen reader', !!big && b2 && b2.title === 'Make smaller' && b2.aria === 'Make smaller' && b2.pressed === 'true' && /^M6 2v4H2/.test(b2.path), JSON.stringify(b2));
    const r2 = await page.evaluate(() => { const r = document.querySelector('#hb-focus .hb-read'); const dock = document.getElementById('ig-dock');
      return { lines: [...r.querySelectorAll('li')].map(li => li.textContent.replace(/\s+/g, ' ').trim()), say: !!document.querySelector('#hb-focus .hb-tr-say'),
        dock: dock ? getComputedStyle(dock).display : 'none', bg: getComputedStyle(r).backgroundColor, border: getComputedStyle(r).borderTopColor }; });
    check('2b the Copilot panel steps aside', r2.dock === 'none', r2.dock);
    check('2c HaTi\'s reading opens the card, in place of the trend line\'s arithmetic', r2.lines.length >= 3 && !r2.say, JSON.stringify(r2.lines));
    check('2d it says the owner\'s picture plainly', r2.lines.some(l => /^\d+ of the \d+ contracts here have been signed\.$/.test(l)) && r2.lines.some(l => /^Most of them are in .+: 11 and 14, 25 in all\.$/.test(l)) && r2.lines.some(l => /^Nothing at all for \d+ months/.test(l)), JSON.stringify(r2.lines));
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, '2-enlarged-reading.png') });

    /* ================= 3. A NUMBER IS A DOOR ================= */
    const d3 = await page.evaluate(() => { const b = [...document.querySelectorAll('#hb-focus .hb-read .hb-read-n')].find(x => x.textContent.trim() === '14'); if (!b) return null; const k = b.getAttribute('data-hb-dig'); b.click(); return k; });
    const s3 = d3 && await until(k => { const p = hbS().path || []; return p[p.length - 1] === k ? { n: hbDigData(k, 'all').n, crumbs: p.length } : null; }, d3);
    check('3a the 14 in the reading opens exactly those 14 contracts', !!s3 && s3.n === 14 && s3.crumbs === 2, JSON.stringify({ d3, s3 }));
    await page.evaluate(() => { const s = hbS(); s.path = s.path.slice(0, 1); hbSave(); hbPaintBoard(); });
    await until(() => !!document.querySelector('#hb-focus .hb-read'));

    /* ================= 4. THEN ASK ================= */
    const ask = await page.evaluate(() => { const b = document.querySelector('#hb-focus [data-hb-why]'); return b ? { word: b.textContent.trim(), cost: (b.parentElement.querySelector('.hb-quiet') || {}).textContent } : null; });
    check('4a one press, its cost said beside it', !!ask && ask.word === 'What could explain this?' && /Nothing is spent until you press/.test(ask.cost || ''), JSON.stringify(ask));
    await page.click('#hb-focus [data-hb-why]');
    const busy = await until(() => { const w = document.querySelector('#hb-focus .hb-why'); return w && /Copilot is reading this chart/.test(w.textContent) ? true : null; }, null, 3000);
    check('4b while Copilot reads, the box says so', !!busy);
    const s4 = await until(() => { const w = document.querySelector('#hb-focus .hb-why:not(.is-err)'); if (!w || !w.querySelector('.hb-why-b')) return null;
      const r = document.querySelector('#hb-focus .hb-read');
      return { t: w.textContent.replace(/\s+/g, ' '), bg: getComputedStyle(w).backgroundColor, border: getComputedStyle(w).borderTopColor, readBorder: getComputedStyle(r).borderTopColor,
        again: !!document.querySelector('#hb-focus [data-hb-why]'), follow: !!w.querySelector('[data-hb-why-follow]'), below: !!(r.compareDocumentPosition(w) & Node.DOCUMENT_POSITION_FOLLOWING), asked: window._asked.length, prompt: window._asked[0] || '' }; });
    check('4c the answer lands under the reading, in Copilot\'s box', !!s4 && s4.below && /Copilot’s read/.test(s4.t) && /late burst: 25 contracts landed in two months/.test(s4.t), s4 && s4.t.slice(0, 200));
    check('4d it wears amber, not the reading\'s teal', !!s4 && s4.border !== s4.readBorder && isAmber(s4.border), s4 && `${s4.border} vs ${s4.readBorder}`);
    check('4e a count this chart does not hold is left out, and the box says so', !!s4 && !/22 contracts were imported/.test(s4.t) && /1 sentence was left out: its number was not on HaTi’s fact sheet\./.test(s4.t), s4 && s4.t.slice(-160));
    check('4f asked once, not offered again; a follow-up goes to the panel', !!s4 && s4.asked === 1 && !s4.again && s4.follow, JSON.stringify({ asked: s4 && s4.asked, again: s4 && s4.again }));
    check('4g Copilot was shown the columns and the contracts behind them', !!s4 && /Columns \(label: value, contracts\):/.test(s4.prompt) && /MK-J0/.test(s4.prompt), s4 && s4.prompt.slice(0, 120));
    await page.screenshot({ path: path.join(OUT, '4-asked.png') });
    const kept = await page.evaluate(() => { hbPaintBoard(); return !!document.querySelector('#hb-focus .hb-why .hb-why-b') && window._asked.length === 1; });
    check('4h kept with its chart: a repaint shows it again without asking', kept);

    /* ================= 5. MAKE SMALLER ================= */
    await page.click('#hb-focus [data-hb-digbig]');
    const s5 = await until(() => !document.querySelector('#hb-focus .hb-dig.is-big') ? { read: !!document.querySelector('#hb-focus .hb-read'), dock: getComputedStyle(document.getElementById('ig-dock') || document.body).display } : null);
    const b5 = await btnOf('#hb-focus [data-hb-digbig]');
    check('5a Make smaller brings the card back and the panel returns', !!s5 && !s5.read && s5.dock !== 'none' && b5 && b5.title === 'Make bigger', JSON.stringify({ s5, b5 }));

    /* ================= 6. A KEPT VIEW WEARS THE SAME BUTTON ================= */
    await page.evaluate(k => { const s = hbS(); s.path = []; s.panels = [{ id: 'p1', kind: 'view', key: k, title: 'Signed by month', shape: '', recipe: s.recipe[k], split: false, big: false }]; s.seq = 1; hbSave(); hbPaintBoard(); }, KEY);
    const v0 = await until(() => document.querySelector('.hb-view [data-hb-act="big"]') ? true : null);
    const bv0 = v0 && await btnOf('.hb-view [data-hb-act="big"]');
    await page.click('.hb-view [data-hb-act="big"]');
    await until(() => document.querySelector('.hb-view.is-big') ? true : null);
    const bv1 = await btnOf('.hb-view [data-hb-act="big"]');
    const vr = await page.evaluate(() => !!document.querySelector('.hb-view.is-big .hb-read'));
    check('6a a kept view: Make bigger at rest, Make smaller enlarged, with the reading', bv0 && bv0.title === 'Make bigger' && bv1 && bv1.title === 'Make smaller' && /^M6 2v4H2/.test(bv1.path) && vr, JSON.stringify({ bv0, bv1, vr }));

    /* ================= 8. EVERY ENLARGED CARD READS =================
       Young, 4 Oct 2026: "i do not see the options in the dashboard" →
       "build all three": Value under contract, Ending in 90 days and the
       ready-made panels, made bigger, read and offer the one ask */
    await page.evaluate(() => { const s = hbS(); s.panels = []; s.path = []; s.digBig = false; s.why = {}; hbSave(); hbPaintBoard(); window._asked = []; });
    const fv = await until(() => document.querySelector('#hb-board [data-hb-dig="f:value"]') ? true : null);
    if (fv) await page.click('#hb-board [data-hb-dig="f:value"]');
    const v8 = await until(() => document.querySelector('#hb-focus [data-hb-digbig]') ? true : null);
    if (v8) await page.click('#hb-focus [data-hb-digbig]');
    const s8a = await until(() => { const r = document.querySelector('#hb-focus .hb-dig.is-big .hb-read'); return r ? { lines: [...r.querySelectorAll('li')].map(li => li.textContent.replace(/\s+/g, ' ').trim()), ask: !!document.querySelector('#hb-focus [data-hb-why="f:value"]') } : null; });
    /* the ask wears one line: the star beside the words, the words inside the frame */
    const fit = await page.evaluate(() => { const b = document.querySelector('#hb-focus [data-hb-why]'); if (!b) return null; const r = b.getBoundingClientRect(), i = b.querySelector('svg').getBoundingClientRect();
      const t = document.createRange(); t.selectNodeContents(b.lastChild); const tr = t.getBoundingClientRect();
      return { h: Math.round(r.height), over: b.scrollHeight - b.clientHeight, sideBySide: i.right <= tr.left + 1 && Math.abs((i.top + i.bottom) / 2 - (tr.top + tr.bottom) / 2) < 4, inside: tr.bottom <= r.bottom + 0.5 }; });
    check('8e the ask button is one line: the star beside its words, inside its frame', !!fit && fit.sideBySide && fit.inside && fit.over <= 0, JSON.stringify(fit));
    check('8a Value under contract can be made bigger, and reads where the money sits', !!s8a && s8a.ask && /^Most of the value, .+ \(\d+%\), sits in .+, across \d+ contracts\.$/.test(s8a.lines[0] || ''), JSON.stringify({ fv, v8, s8a }));
    await page.screenshot({ path: path.join(OUT, '8a-value-reading.png') });
    await page.evaluate(() => { const s = hbS(); s.path = []; s.digBig = false; hbSave(); hbPaintBoard(); });
    const fe = await until(() => document.querySelector('#hb-board [data-hb-dig="f:ending"]') ? true : null);
    if (fe) await page.click('#hb-board [data-hb-dig="f:ending"]');
    if (await until(() => document.querySelector('#hb-focus [data-hb-digbig]') ? true : null)) await page.click('#hb-focus [data-hb-digbig]');
    const s8b = await until(() => { const r = document.querySelector('#hb-focus .hb-dig.is-big .hb-read'); return r ? [...r.querySelectorAll('li')].map(li => li.textContent.replace(/\s+/g, ' ').trim()) : null; });
    check('8b Ending in 90 days, made bigger, names the first to end', !!s8b && s8b.some(l => /end in the next 90 days; the first is MK-S0 \(Nordkraft AB\), on /.test(l)), JSON.stringify({ fe, s8b }));
    await page.screenshot({ path: path.join(OUT, '8b-ending-reading.png') });
    await page.evaluate(() => { const s = hbS(); s.path = []; s.digBig = false; s.panels = [{ id: 'p8', kind: 'ren', split: false, big: false }]; s.seq = 8; hbSave(); hbPaintBoard(); });
    const p0 = await until(() => document.querySelector('.hb-panel[data-hb-pid="p8"] [data-hb-act="big"]') ? { read: !!document.querySelector('.hb-panel[data-hb-pid="p8"] .hb-read') } : null);
    if (p0) await page.click('.hb-panel[data-hb-pid="p8"] [data-hb-act="big"]');
    const s8c = await until(() => { const P = document.querySelector('.hb-panel.is-big[data-hb-pid="p8"]'); const r = P && P.querySelector('.hb-read'); return r ? { lines: [...r.querySelectorAll('li')].map(li => li.textContent.replace(/\s+/g, ' ').trim()), ask: !!P.querySelector('[data-hb-why="hp:ren"]') } : null; });
    check('8c a ready-made panel: nothing extra at normal size; made bigger, it reads and offers the ask', !!p0 && !p0.read && !!s8c && s8c.ask && s8c.lines.some(l => /^The first to end is MK-S0 \(Nordkraft AB\), in \d+ days/.test(l)), JSON.stringify({ p0, s8c }));
    if (s8c) await page.click('.hb-panel[data-hb-pid="p8"] [data-hb-why="hp:ren"]');
    const s8d = await until(() => { const P = document.querySelector('.hb-panel[data-hb-pid="p8"]'); const w = P && P.querySelector('.hb-why:not(.is-err) .hb-why-b'); const r = P && P.querySelector('.hb-read');
      return w ? { t: w.textContent.replace(/\s+/g, ' ').trim(), border: getComputedStyle(w.parentElement).borderTopColor, readBorder: r ? getComputedStyle(r).borderTopColor : '', prompt: window._asked[0] || '' } : null; });
    check('8d asked from the panel, the answer lands in the panel\'s own amber box', !!s8d && /Worth checking which of the open ones/.test(s8d.t) && isAmber(s8d.border) && s8d.border !== s8d.readBorder && /^A panel on the HaTi Home board: "Ending in the next 90 days"\./.test(s8d.prompt), JSON.stringify(s8d && { t: s8d.t, border: s8d.border, p: s8d.prompt.slice(0, 90) }));
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, '8d-panel-asked.png') });

    /* ================= 7. LIGHT ================= */
    await page.evaluate(k => { const s = hbS(); s.panels = []; s.path = [k]; s.digBig = true; hbSave(); setView('dashboard'); }, KEY);
    await until(() => document.querySelector('[data-hb-screen="light"]') ? true : null);
    await page.click('[data-hb-screen="light"]');
    await until(() => document.querySelector('#hb-focus .hb-why .hb-why-b') ? true : null);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, '7-light.png') });
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    check('stage ran', false, e.message + (errors.length ? ' | page errors: ' + errors.slice(0, 3).join(' | ') : ''));
  } finally {
    await browser.close(); await h.stop();
    const bad = results.filter(r => !r.pass);
    console.log(`\n${results.length - bad.length}/${results.length} passed`);
    process.exit(bad.length ? 1 : 0);
  }
})();
