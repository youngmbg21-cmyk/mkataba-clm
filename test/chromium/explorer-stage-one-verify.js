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
   timeline counts each stretch in a strip above its lanes; (5) an amendment's
   link names itself on hover. Then the Brain, as the owner picked it by name
   ("Glow", 18 Oct 2026): (8) "shade the lobes by liability cap" puts an amber
   glow round each lobe holding uncapped contracts and a count on its card;
   "size the lobes by value" spreads each lobe by its share of the value.

   Every claim measures what was PAINTED: the canvas's own fillText and fill
   are listened to for a frame, so a total held in a variable but never drawn
   reads red. Waits ask for the state, bounded. Money obeys canViewValues: the
   totals drop their value for a reader who may not see money (6).

   Red at the parent (705dc90): no floor or grid total is painted, no cell is
   amber, "shade the cells by money" is not understood, no contract carries a
   tail, there is no strip, no link answers the pointer, and no lobe glows or
   grows.

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
  /* the mfg stream is kept fully capped: a clean lobe the glow must leave alone (8c) */
  c.metadata = Object.assign({}, c.metadata || {}, { liabilityCapped: ST[i % 3] === 'mfg' && LC[i % 5] === 'uncapped' ? 'capped' : LC[i % 5] });
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
    /* RE-PINNED 27 Oct 2026 (owner: "roll out the jambo capabilities from the board's jambo to all the jambos"): everything typed on a Jambo tab goes to the AI (igTalkFirst); this check is about the free readers, so it types under Overview — an answer turns the panel to his tab, and one press on it turns back */
    await page.evaluate(() => { if (typeof pdTalkShows === 'function' && pdTalkShows()) { const t = document.querySelector('#ig-dock [data-pd-talk]'); if (t) t.click(); } }); await page.fill('#igd-input', q); await page.click('#igd-go');
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

    /* ================= 8. GLOW: THE BRAIN'S LOBES ============================ */
    await page.evaluate(() => { igbCam().spin = false; igSetView(1); });
    await settle(1);
    await ask('shade the lobes by liability cap');
    await settle(0);
    const g8 = await page.evaluate(() => ({ shade: intel.lobeShade, view: igbCam().view, said: (intel.history[intel.history.length - 1] || {}).text || '',
      hubs: IG.hubs.map(h => ({ label: h.label, n: h.attn && h.attn.n, t: h.attn && h.attn.t, card: (h.g && h.g.querySelector('[data-ig-attn]') || {}).textContent || '' })) }));
    check('8a "shade the lobes by liability cap" turns to the Brain and says the lobes glow by it', g8.shade === 'liability' && g8.view === 0 && /glows amber/.test(g8.said), JSON.stringify({ shade: g8.shade, view: g8.view, said: g8.said }));
    const cardsOk = g8.hubs.every(h => h.card === `${h.n} of ${h.t} uncapped · ${Math.round(h.n / Math.max(1, h.t) * 100)}%`);
    check('8b every group\'s card says how many of its contracts are uncapped, and its share', g8.hubs.length >= 3 && cardsOk && g8.hubs.some(h => h.n > 0), JSON.stringify(g8.hubs.map(h => h.label + ': ' + h.card)));
    const glow = await page.evaluate(() => new Promise(res => {
      const ctx = IG.ctx, crg = ctx.createRadialGradient, dri = ctx.drawImage, recs = [];
      ctx.createRadialGradient = function (x0, y0, r0, x1, y1, r1) { const gr = crg.apply(this, arguments), rec = { x: x0, y: y0, r: r1, cols: [] }; recs.push(rec);
        const as = gr.addColorStop.bind(gr); gr.addColorStop = (o, c) => { rec.cols.push(String(c)); return as(o, c); }; return gr; };
      /* RE-POINTED 22 Oct 2026 (owner: "make the still map lighter"): a glow is painted once per colour
         and stamped (igbGlowSprite), the stamp saying its colour (data-igb-glow); read as the gradient was */
      ctx.drawImage = function (img, x, y, w, h) { const col = img && img.dataset && img.dataset.igbGlow;
        if (col && arguments.length === 5){ const n = parseInt(col.slice(1), 16);
          recs.push({ x: x + w / 2, y: y + h / 2, r: w / 2, cols: [`rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${this.globalAlpha})`] }); }
        return dri.apply(this, arguments); };
      try { igWake(); } catch (_) {}
      setTimeout(() => { ctx.createRadialGradient = crg; ctx.drawImage = dri;
        /* a lobe's glow is wide and sits on the lobe's own point; amber is also the "In review" stage's
           colour, so a dot's own glow is amber too — the glow is matched to each lobe's point */
        const amberAt = h => recs.some(r => r.r >= 60 && Math.hypot(h.q[0] - r.x, h.q[1] - r.y) < 2 && /^rgba\(242,\s*178,\s*76,/.test(r.cols[0] || '') && Number((/,\s*([\d.]+)\)$/.exec(r.cols[0]) || [])[1]) >= .02);
        /* a lobe turned to the back fades its glow with its card (igbDraw's own facing weight) */
        const open = IG.hubs.filter(h => h.q && h.fold < .95), facing = open.filter(h => (h.q[3] + .25) * 2 > .1);
        res({ want: facing.filter(h => h.attn && h.attn.n).map(h => h.label), lit: facing.filter(h => h.attn && h.attn.n && amberAt(h)).map(h => h.label),
          clean: open.filter(h => h.attn && !h.attn.n).map(h => h.label), cleanLit: open.filter(h => h.attn && !h.attn.n && amberAt(h)).map(h => h.label),
          all: IG.hubs.map(h => h.label + ':' + (h.attn && h.attn.n) + ':' + (h.fold || 0).toFixed(1) + ':' + (h.q ? h.q[3].toFixed(2) : '-')) }); }, 450); }));
    check('8c the canvas paints an amber glow round every lobe holding uncapped contracts, and none round a clean lobe',
      glow.want.length >= 1 && glow.lit.length === glow.want.length && glow.clean.length >= 1 && glow.cleanLit.length === 0, JSON.stringify(glow));
    const leg8 = await page.evaluate(() => document.querySelector('[data-ig-legend-glow]')?.textContent.trim() || '');
    check('8d the legend names the glow', /Glow: share uncapped/.test(leg8), leg8);
    await page.screenshot({ path: path.join(OUT, '8-brain-glow.png') });
    const spread = () => page.evaluate(() => { const m = {}; IG.hubs.forEach(h => { const k = h.kids.map(n => n.At); if (k.length < 2) return; const c = [0, 1, 2].map(i => k.reduce((a, p) => a + p[i], 0) / k.length);
      m[h.label] = { v: h.val, k: h.sizeK, s: k.reduce((a, p) => a + Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]), 0) / k.length }; }); return m; });
    const before = await spread();
    await ask('size the lobes by value');
    const after = await spread();
    const labs = Object.keys(after).sort((a, b) => after[b].v - after[a].v), top = labs[0], low = labs[labs.length - 1];
    const grew = l => after[l].s / before[l].s;
    check('8e "size the lobes by value": the richest lobe spreads wider than it did, and grows more than the poorest; the legend says so',
      (await page.evaluate(() => intel.lobeSize)) === 'value' && grew(top) > 1.15 && grew(top) > grew(low) * 1.05 && after[top].k > after[low].k
      && /group’s value/.test(await page.evaluate(() => document.querySelector('[data-ig-legend-lobesize]')?.textContent || '')),
      JSON.stringify({ top, low, grewTop: grew(top), grewLow: grew(low), kTop: after[top].k, kLow: after[low].k }));
    await ask('shade the lobes by owner');
    const no8 = await page.evaluate(() => ({ shade: intel.lobeShade, said: (intel.history[intel.history.length - 1] || {}).text || '', presses: document.querySelectorAll('#ig-dock [data-ig-choice]').length }));
    check('8f a fact that is not a needs-attention fact cannot shade the lobes: it says so and offers the five', no8.shade === 'liability' && /cannot shade them/.test(no8.said) && no8.presses === 5, JSON.stringify(no8));
    await ask('stop shading');
    check('8g "stop shading" takes the glow and the cards\' counts off', await page.evaluate(() => intel.lobeShade === null && !document.querySelector('[data-ig-attn]')));
    await page.evaluate(() => { window.__cvv = window.canViewValues; window.canViewValues = () => false; });
    await ask('size the lobes by value');
    const m8 = await page.evaluate(() => ({ size: intel.lobeSize, said: (intel.history[intel.history.length - 1] || {}).text || '' }));
    await page.evaluate(() => { window.canViewValues = window.__cvv; });
    check('8h for a reader who may not see money the lobes keep following their count, and say so', m8.size === null && /how many contracts/.test(m8.said), JSON.stringify(m8));

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
