/* Chromium verification: EXPLORER STAGE 1 — THE VIEWS SAY MORE
   ============================================================
   The owner, 18 Oct 2026, after the "five views explaining themselves"
   pictures: "Let's start with stage 1 … go with your recommendations". Five
   additions, drawn as pictured, each reading a fact the map already holds:
   (1) every floor carries its total under its name; (2) the Grid's cells are
   darker the more they hold, amber where a row or column is a needs-attention
   bucket (IG_ATTN), with each row's and column's total; "shade the cells by
   money" shades by value; (3) on the renewal-decision and expiry timelines a
   contract with a notice period carries a tail — the notice period; (4) the
   timeline counts each stretch in a strip under its dates; (5) an amendment's
   link names itself on hover.

   Every claim measures what was PAINTED: the canvas's own fillText and fill
   are listened to for a frame, so a total held in a variable but never drawn
   reads red. Waits ask for the state, bounded. Money obeys canViewValues: the
   totals drop their value for a reader who may not see money (6).

   Red at the parent (705dc90): no floor or grid total is painted, no cell is
   amber, "shade the cells by money" is not understood, no contract carries a
   tail, there is no strip and no link answers the pointer.

   Screenshots go to test/chromium/shots/explorer-stage-one/ (or HATI_SHOT_DIR).
   Run: node test/chromium/explorer-stage-one-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FIXTURES } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'explorer-stage-one');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/* the last day of a whole calendar month `off` months from now: one month whatever today is */
const monthEnd = off => { const n = new Date(); n.setHours(0, 0, 0, 0); return iso(new Date(n.getFullYear(), n.getMonth() + off + 1, 0)); };

/* A book over three streams with liability caps read, notice periods on most,
   end dates spread over the next year and a half, and one amendment. */
const ST = ['proc', 'sales', 'mfg'], LC = ['capped', 'uncapped', 'capped', 'unclear', 'capped'];
const NOTICE = [30, 60, 90, 0, 45];
const BOOK = FIXTURES.concat(Array.from({ length: 30 }, (_, i) => {
  const c = fixtureContract('MK-S' + i, ['Freight Services', 'Cloud Hosting', 'Facilities Management'][i % 3], ['Kipande', 'Savanna', 'Mvua', 'Tausi'][i % 4],
    ST[i % 3], ((i * 37) % 90 + 5) * 1e6, ['Signed', 'Signed', 'Under Review', 'Draft'][i % 4]);
  c.metadata = Object.assign({}, c.metadata || {}, { liabilityCapped: LC[i % 5] });
  if (NOTICE[i % 5]) c.metadata.noticePeriodDays = NOTICE[i % 5];
  c.expiry = monthEnd(3 + (i % 16));
  return c;
})).concat([Object.assign(fixtureContract('MK-S0-A1', 'Freight Services — Amendment 1', 'Kipande', 'proc', 4e6, 'Signed'),
  { parentId: 'MK-S0', relation: 'amendment', expiry: monthEnd(9) })]);

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
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  const ask = async q => { const n = await page.evaluate(() => intel.history.length);
    await page.fill('#igd-input', q); await page.click('#igd-go');
    await until(k => !intel.busy && intel.history.length >= k + 2, n); await page.waitForTimeout(300); };
  /* what the canvas PAINTS in the next frames: every fillText and every fill's colour */
  const paint = () => page.evaluate(() => new Promise(res => {
    const ctx = IG && IG.ctx; if (!ctx) return res({ texts: [], fills: [] });
    const texts = [], fills = [], ft = ctx.fillText, fl = ctx.fill;
    ctx.fillText = function (t, ...a) { texts.push(String(t)); return ft.call(this, t, ...a); };
    ctx.fill = function (...a) { fills.push(String(this.fillStyle)); return fl.apply(this, a); };
    try { if (typeof igWake === 'function') igWake(); } catch (_) {}
    setTimeout(() => { ctx.fillText = ft; ctx.fill = fl; res({ texts, fills }); }, 450);
  }));
  const settle = v => until(k => intel.cam && intel.cam.w[k] > 0.97, v);
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-S7'), null, { timeout: 15000 });
    await page.evaluate(() => { try { localStorage.removeItem('hati.v1.igViews'); } catch (_) {} intel.cam = null; intel.tab = 'map'; setView('intel'); });
    await until(() => window.IG && IG.hubs && IG.hubs.length >= 3);

    /* ================= 1. EVERY FLOOR SAYS WHAT IT HOLDS ===================== */
    await page.evaluate(() => igSetView(2)); await settle(2);
    const fl = await page.evaluate(() => ({ floors: (IG.floors || []).map(f => ({ label: f.label, n: f.n, v: f.v })), kids: IG.nodes.filter(n => n.kind === 'contract').length }));
    const p1 = await paint();
    const want1 = fl.floors.filter(f => f.n > 0).map(f => f.n === 1 ? '1 contract' : f.n + ' contracts');
    const drawn1 = want1.filter(w => p1.texts.some(t => t === w || t.startsWith(w + ' · ')));
    check('1a every floor holding contracts carries its count under its name, painted on the canvas', want1.length >= 2 && drawn1.length === want1.length, JSON.stringify({ want1, drawn1 }));
    check('1b the floors\' counts add up to every contract on the map', fl.floors.reduce((a, f) => a + (f.n || 0), 0) === fl.kids, JSON.stringify(fl));
    check('1c a floor\'s total says its money for a reader who may see money', p1.texts.some(t => /contracts? · KES/.test(t)), [...new Set(p1.texts.filter(t => /contract/.test(t)))].join(' | '));
    await page.screenshot({ path: path.join(OUT, '1-floor-totals.png') });

    /* ================= 2. THE GRID: HEAT, AMBER AND TOTALS ==================== */
    await ask('streams against liability cap');
    await settle(3);
    const g = await page.evaluate(() => ({ floorKey: IG.floorKey, colKey: IG.colKey, rows: (IG.floors || []).map(f => f.label), cells: Object.values(IG.grid.cells).map(c => ({ n: c.n, ci: c.ci, fi: c.fi })) }));
    check('2a "streams against liability cap" draws the Grid: streams across, liability caps down', g.floorKey === 'liability' && g.rows.includes('Liability uncapped'), JSON.stringify({ fk: g.floorKey, rows: g.rows }));
    const p2 = await paint();
    /* a cell's heat is a light wash (alpha .05–.35 of the view's weight): other amber on the canvas (a dot coloured by a fact, the walk) is paint, not shading */
    const amber = p2.fills.filter(f => { const m = /^rgba\(242, 178, 76, ([\d.]+)\)$/.exec(f); return m && Number(m[1]) <= 0.36; });
    check('2b the "Liability uncapped" row is shaded amber, the needs-attention colour', amber.length >= 1, amber.slice(0, 3).join(' | '));
    const alphas = p2.fills.map(f => { const m = /^rgba\((\d+), (\d+), (\d+), ([\d.]+)\)$/.exec(f); return m ? Number(m[4]) : null; }).filter(x => x != null && x > 0.02 && x < 0.5);
    check('2c a fuller cell is painted darker than an emptier one (the heat)', alphas.length >= 2 && Math.max(...alphas) - Math.min(...alphas) > 0.08, JSON.stringify([Math.min(...alphas), Math.max(...alphas)]));
    const rowTot = g.rows.map((_, fi) => g.cells.filter(c => c.fi === fi).reduce((a, c) => a + c.n, 0)).filter(n => n > 0);
    check('2d each row\'s total and its share are painted under its name, the columns\' under their headings after "ALL"',
      p2.texts.filter(t => t === 'ALL').length >= 1 && rowTot.every(n => p2.texts.includes(String(n))) && p2.texts.some(t => / · \d+%$/.test(t) || / · <1%$/.test(t)),
      JSON.stringify({ rowTot, all: p2.texts.includes('ALL'), shares: [...new Set(p2.texts.filter(t => /%$/.test(t)))] }));
    const leg2 = await page.evaluate(() => ({ heat: document.querySelector('[data-ig-legend-heat]')?.textContent.trim() || '', attn: document.querySelector('[data-ig-legend-attn]')?.textContent.trim() || '' }));
    check('2e the legend says what the shading means, on the Grid', /more contracts/.test(leg2.heat) && /Needs attention/.test(leg2.attn), JSON.stringify(leg2));
    await page.screenshot({ path: path.join(OUT, '2-grid-heat-and-totals.png') });

    /* ================= 3. SHADE THE CELLS BY MONEY ============================ */
    await ask('shade the cells by money');
    const s3 = await page.evaluate(() => ({ shade: intel.shadeBy, said: (intel.history[intel.history.length - 1] || {}).text || '', heat: document.querySelector('[data-ig-legend-heat]')?.textContent.trim() || '' }));
    check('3a "shade the cells by money" shades the Grid by value, says so, and the legend follows', s3.shade === 'value' && /shaded by money/.test(s3.said) && /more money/.test(s3.heat), JSON.stringify(s3));
    await ask('shade by count');
    check('3b "shade by count" goes back to counting contracts', (await page.evaluate(() => intel.shadeBy)) === null);

    /* ================= 4. NOTICE TAILS ON THE TIMELINE ======================== */
    await page.evaluate(() => { intel.timeBy = null; rebuildIntelGraph(); igSetView(4); });
    await settle(4);
    const t4 = await page.evaluate(() => {
      const kids = IG.nodes.filter(n => n.kind === 'contract');
      const owed = kids.filter(n => Number(n.c.metadata && n.c.metadata.noticePeriodDays) > 0 && graphDecisionOf(n.c).date);
      return { key: IG.tl.key, owed: owed.length, tails: kids.filter(n => n._tail != null).length,
        forward: kids.filter(n => n._tail != null).every(n => n._tail > n.Tt[0] - 1e-6),
        none: kids.filter(n => !(Number(n.c.metadata && n.c.metadata.noticePeriodDays) > 0)).every(n => n._tail == null),
        legend: document.querySelector('[data-ig-legend-tail]')?.textContent.trim() || '' };
    });
    check('4a on the renewal-decision timeline every contract with a notice period carries a tail, and no other does', t4.key === 'decision' && t4.owed >= 5 && t4.tails === t4.owed && t4.none, JSON.stringify(t4));
    check('4b the tail runs forward from the last notice day to the day it ends, and the legend says so', t4.forward && /notice period/.test(t4.legend), t4.legend);

    /* ================= 5. THE STRIP UNDER THE DATES =========================== */
    const p5 = await paint();
    const s5 = await page.evaluate(() => ({ strip: (IG.tl.strip || []).reduce((a, s) => a + s.n, 0), dated: IG.nodes.filter(n => n.kind === 'contract').length - IG.tl.undated, step: IG.tl.step,
      per: i18t('int_tl_per_' + IG.tl.step), word: i18t('int_tl_strip_decision') }));
    check('5a the strip counts every dated contract once, in the timeline\'s own stretches', s5.strip === s5.dated && s5.dated > 0, JSON.stringify(s5));
    check('5b the strip is painted with its name and its stretch ("Decisions" · "per quarter")', p5.texts.includes(s5.word) && p5.texts.includes(s5.per), JSON.stringify({ word: s5.word, per: s5.per }));
    await page.screenshot({ path: path.join(OUT, '5-timeline-tails-and-strip.png') });
    await ask('timeline by expiry');
    await settle(4);
    const t5 = await page.evaluate(() => { const k = IG.nodes.filter(n => n.kind === 'contract' && n._tail != null);
      return { key: IG.tl.key, n: k.length, back: k.every(n => n._tail < n.Tt[0] + 1e-6), legend: document.querySelector('[data-ig-legend-tail]')?.textContent.trim() || '' }; });
    check('5c on the expiry timeline the tail runs back to the last day to give notice', t5.key === 'expiry' && t5.n >= 5 && t5.back && /last day to give notice/.test(t5.legend), JSON.stringify(t5));

    /* ================= 6. MONEY IS THE READER'S ================================ */
    await page.evaluate(() => { window.__cvv = window.canViewValues; window.canViewValues = () => false; igSetView(2); });
    await settle(2);
    const p6 = await paint();
    await page.evaluate(() => { window.canViewValues = window.__cvv; });
    check('6a for a reader who may not see money the floor totals are counts alone', p6.texts.some(t => /^\d+ contracts?$/.test(t)) && !p6.texts.some(t => /contracts? · KES/.test(t)), [...new Set(p6.texts.filter(t => /contract/.test(t)))].join(' | '));

    /* ================= 7. A LINK SAYS WHY ===================================== */
    await page.evaluate(() => igSetView(1)); await settle(1);
    const l7 = await until(() => { const p = document.querySelector('[data-ig-link-hit="family"]'); if (!p || p.style.display === 'none' || !p.getAttribute('d')) return null;
      const r = p.getBoundingClientRect(); if (!r.width && !r.height) return null;
      const len = p.getTotalLength(), mid = p.getPointAtLength(len / 2), m = p.getScreenCTM(), x = mid.x * m.a + mid.y * m.c + m.e, y = mid.x * m.b + mid.y * m.d + m.f;
      p.dispatchEvent(new PointerEvent('pointerenter', { clientX: x, clientY: y }));
      const hv = document.getElementById('ig-hover'); return hv && !hv.hidden ? { says: hv.querySelector('[data-ig-link-says]')?.textContent || '', head: hv.textContent } : null; });
    check('7a pointing at an amendment\'s link opens the hover card naming what it is an amendment of', !!l7 && /of MK-S0\b/.test(l7.says) && /MK-S0-A1/.test(l7.head), JSON.stringify(l7));
    await page.screenshot({ path: path.join(OUT, '7-link-says-why.png') });
    await page.evaluate(() => { const p = document.querySelector('[data-ig-link-hit="family"]'); p && p.dispatchEvent(new PointerEvent('pointerleave')); });
    check('7b leaving the link puts the card away', await page.evaluate(() => { const hv = document.getElementById('ig-hover'); return !hv || hv.hidden; }));

    check('9a no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.stack ? e.stack.split('\n').slice(0, 3).join(' ') : String(e));
  } finally {
    await browser.close();
    await h.stop();
  }
  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})();
