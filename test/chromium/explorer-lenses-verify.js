/* Chromium verification: EXPLORER LENSES, STAGE 1 — RISK AND OBLIGATIONS
   ===================================================================
   The owner picked "Lenses" by name (8 Nov 2026, the Explorer design round)
   and asked for stage 1: the Risk and Obligations lenses, the legend that
   counts them, Jambo explaining a lens worst first, and the card's door onto
   the page that already works the fact.

   Measured, not described:
   1. the Lens group stands in the view bar (Off · Risk · Obligations), Off pressed at rest;
   2. Risk: every dot wears a ring in every one of the five views (counted off
      the strokes the canvas really paints, which no other mark uses), and the
      legend counts each bucket exactly as the record says;
   3. Obligations: the same, with "Late" counting the fixture's late duties;
   4. the card speaks for the lens and its door lands where it says — the
      Redlines face's Risks to look at, the Obligations tab;
   5. Explain this lens walks worst first and names the one paid question with its cost;
   6. the lens rides the recipe: Undo takes it off, the words turn it on and off;
   7. the owner's three screens: the Lens row inside the stage, clear of the legend.

   Red at the parent: there is no lens at all (1–6), so each check reports
   rather than times out.

   Run: node test/chromium/explorer-lenses-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'explorer-lenses');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/* days counted from today, so the fixture means the same whatever day it runs */
const day = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return iso(d); };
const ST = ['proc', 'sales', 'mfg'];
const F = (id, sev, title) => ({ id, sev, title, kind: 'risk', what: title, why: title });
/* 18 contracts: proc carries the high risk; 3 never scanned; 4 with a late duty, 4 due within 30 days */
const BOOK = Array.from({ length: 18 }, (_, i) => {
  const c = fixtureContract('MK-L' + i, ['Freight Services', 'Retail Supply', 'Component Supply'][i % 3] + ' ' + i,
    ['Kipande', 'Savanna', 'Mvua'][i % 3], ST[i % 3], ((i * 37) % 90 + 5) * 1e6, i % 4 ? 'Signed' : 'Under Review');
  if (i % 6 !== 5) {
    const f = [];
    if (i % 3 === 0) f.push(F('f' + i + 'a', 'high', 'Liability not capped'), F('f' + i + 'b', 'high', 'Termination on 30 days'));
    if (i % 3 === 1) f.push(F('f' + i + 'a', 'med', 'Renews by itself'));
    if (i % 3 === 2 && i % 2) f.push(F('f' + i + 'a', 'low', 'Notices by post only'));
    c.scan = { at: new Date().toISOString(), findings: f, dismissed: [] };
  }
  const late = i % 5 === 0, soon = i % 5 === 1;
  c.obligations = [{ id: 'ob' + i, desc: (late ? 'Quarterly price review ' : 'Monthly service report ') + i, due: late ? day(-6 - i) : soon ? day(10 + i) : day(60 + i * 5), status: 'open', party: i % 2 ? 'ours' : 'theirs' }];
  return c;
});
/* what the record says, counted here, never by the page */
const score = c => !c.scan ? null : c.scan.findings.reduce((s, f) => s + ({ high: 5, med: 2, low: 1 })[f.sev], 0);
const riskOf = c => { const r = score(c); return r == null ? 'unscanned' : r >= 8 ? 'high' : r >= 3 ? 'med' : r >= 1 ? 'low' : 'clean'; };
const WANT_RISK = BOOK.reduce((m, c) => (m[riskOf(c)] = (m[riskOf(c)] || 0) + 1, m), {});
const lateOf = c => c.obligations.some(o => o.due < day(0));
const WANT_LATE = BOOK.filter(lateOf).length;

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati({ HATI_AGENTS_AUTO: 'off' });
  await seedWorkspace(h, { contracts: BOOK, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 780 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message + ' @ ' + String(e.stack || '').split('\n').slice(1, 2).join(' ')));
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  /* the strokes a lens paints (widths 2.4, 1.4 and 1.5, which no other mark on this book uses; the canvas keeps a
     width at single precision, so 2.4 reads back as 2.4000000953…) — counted over painted frames */
  const lensStrokes = () => page.evaluate(() => new Promise(res => {
    const P = window.CanvasRenderingContext2D.prototype, st = P.stroke; let n = 0;
    P.stroke = function (...a) { if (this.canvas && this.canvas.id === 'ig-cv' && [2.4, 1.4, 1.5].some(w => Math.abs(this.lineWidth - w) < 0.01)) n++; return st.apply(this, a); };
    /* a still map paints only when something moves: turn to the next view and back, so frames are painted */
    const v = igbCam().view; igSetView((v + 1) % 5); setTimeout(() => igSetView(v), 250);
    setTimeout(() => { P.stroke = st; res(n); }, 900);
  }));
  const press = async sel => { const ok = await page.evaluate(s => { const b = document.querySelector(s); if (!b) return false; b.click(); return true; }, sel); await page.waitForTimeout(400); return ok; };
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-L7'), null, { timeout: 15000 });
    await until(() => state.view === 'counter', null, 10000);
    await page.evaluate(() => { intel.cam = null; intel.tab = 'map'; intel.dockOpen = true; setView('dashboard'); hbSetFace('explorer'); });
    await until(() => hbFace() === 'explorer' && window.IG && IG.nodes && IG.nodes.filter(n => n.kind === 'contract').length === 18 && !!document.querySelector('.ig-viewbar'));
    await page.waitForTimeout(800);

    /* ================= 1. THE LENS GROUP ================= */
    const bar = await page.evaluate(() => [...document.querySelectorAll('.ig-viewbar [data-ig-lens]')].map(b => [b.getAttribute('data-ig-lens'), b.textContent.trim(), b.getAttribute('aria-pressed')]));
    check('1a the view bar carries the Lens group: Off · Risk · Obligations, Off pressed at rest',
      JSON.stringify(bar) === JSON.stringify([['off', 'Off', 'true'], ['risk', 'Risk', 'false'], ['obligations', 'Obligations', 'false']]), JSON.stringify(bar));
    const quiet = await lensStrokes();
    check('1b with no lens, no dot wears a lens mark', quiet === 0, String(quiet));

    /* ================= 2. RISK ================= */
    await press('.ig-viewbar [data-ig-lens="risk"]');
    const r2 = await page.evaluate(() => ({ lens: window.intel && intel.lens, pressed: document.querySelector('[data-ig-lens="risk"]')?.getAttribute('aria-pressed'),
      folded: intel.legendFolded, rows: [...document.querySelectorAll('#ig-legend [data-ig-lens-row]')].map(r => [r.getAttribute('data-ig-lens-row'), Number(r.querySelector('.igl-n')?.textContent)]) }));
    check('2a pressing Risk turns the lens on, pressed, and opens the legend', r2.lens === 'risk' && r2.pressed === 'true' && r2.folded === false, JSON.stringify(r2));
    const got = Object.fromEntries((r2.rows || []).filter(x => x[1]).map(x => [x[0], x[1]]));
    check('2b the legend counts each risk bucket exactly as the record says', JSON.stringify(got) === JSON.stringify(Object.fromEntries(Object.entries(WANT_RISK).sort((a, b) => ['high', 'med', 'low', 'clean', 'unscanned'].indexOf(a[0]) - ['high', 'med', 'low', 'clean', 'unscanned'].indexOf(b[0])))), JSON.stringify({ got, want: WANT_RISK }));
    const legendSays = await page.evaluate(() => (document.querySelector('#ig-legend [data-ig-lens-note]') || {}).textContent || '');
    check('2c the legend says what the ring means and where it is read from', /One ring segment per open finding/.test(legendSays) && /risk scan/.test(legendSays), legendSays);
    const perView = [];
    for (let v = 0; v < 5; v++) { await page.evaluate(v => igSetView(v), v); await page.waitForTimeout(900); perView.push(await lensStrokes()); }
    check('2d every one of the five views paints the risk rings', perView.every(n => n >= 12), JSON.stringify(perView));
    await page.evaluate(() => igSetView(1)); await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT, '2-risk-wiring.png') });

    /* ================= 3. OBLIGATIONS ================= */
    await press('.ig-viewbar [data-ig-lens="obligations"]');
    const r3 = await page.evaluate(() => ({ lens: window.intel && intel.lens, rows: Object.fromEntries([...document.querySelectorAll('#ig-legend [data-ig-lens-row]')].map(r => [r.getAttribute('data-ig-lens-row'), Number(r.querySelector('.igl-n')?.textContent)])) }));
    check('3a Obligations: the legend counts the late duties as the record says', r3.lens === 'obligations' && r3.rows.late === WANT_LATE, JSON.stringify({ r3, WANT_LATE }));
    const ob = await lensStrokes();
    check('3b every dot with an open duty wears its clock', ob >= 18, String(ob));
    await page.screenshot({ path: path.join(OUT, '3-obligations.png') });

    /* ================= 4. THE CARD AND ITS DOOR ================= */
    const late = BOOK.find(lateOf);
    await page.evaluate(id => { igExplain(id); renderIntelDock(); }, late.id); await page.waitForTimeout(500);
    const card = await page.evaluate(() => { const c = document.querySelector('#ig-dock [data-ig-hoverid]'); return c ? { next: (c.querySelector('[data-ig-fact="lens_next"]') || {}).textContent || '', door: (c.querySelector('[data-ig-lens-door]') || {}).textContent || '' } : null; });
    check('4a the card says the duty that is late, and carries the Obligations door', !!card && /late/.test(card.next) && /Quarterly price review/.test(card.next) && /Obligations/.test(card.door), JSON.stringify(card));
    await press('#ig-dock [data-ig-lens-door="obligations"]'); await page.waitForTimeout(900);
    const landedOb = await page.evaluate(() => ({ face: hbFace(), tab: typeof pdTab === 'function' ? pdTab() : null, paper: intel.paper && intel.paper.id }));
    check('4b the Obligations door lands on that contract, on its Obligations tab', landedOb.face === 'paper' && landedOb.tab === 'oblig' && landedOb.paper === late.id, JSON.stringify(landedOb));
    await page.evaluate(() => { hbSetFace('explorer'); }); await until(() => hbFace() === 'explorer' && !!document.querySelector('.ig-viewbar'));
    await press('.ig-viewbar [data-ig-lens="risk"]');
    const hi = BOOK.find(c => riskOf(c) === 'high');
    await page.evaluate(id => { igExplain(id); renderIntelDock(); }, hi.id); await page.waitForTimeout(500);
    const card2 = await page.evaluate(() => { const c = document.querySelector('#ig-dock [data-ig-hoverid]'); return c ? { risk: (c.querySelector('[data-ig-fact="lens_risk"]') || {}).textContent || '', worst: (c.querySelector('[data-ig-fact="lens_worst"]') || {}).textContent || '', door: (c.querySelector('[data-ig-lens-door]') || {}).textContent || '' } : null; });
    check('4c the card says the risk, the worst finding, and carries Risks on the paper', !!card2 && /High risk · 2 findings/.test(card2.risk) && card2.worst.length > 3 && /Risks on the paper/.test(card2.door), JSON.stringify(card2));
    await press('#ig-dock [data-ig-lens-door="risk"]');
    const landedRk = await until(() => { const el = document.querySelector('#ig-dock #rl-risks'); return el && hbFace() === 'paper' ? { paper: intel.paper && intel.paper.id, top: Math.round(el.getBoundingClientRect().top), h: innerHeight } : null; }, null, 6000);
    check('4d Risks on the paper lands on that contract\'s Risks to look at, in view', !!landedRk && landedRk.paper === hi.id && landedRk.top < landedRk.h, JSON.stringify(landedRk));
    await page.screenshot({ path: path.join(OUT, '4-risks-on-the-paper.png') });
    await page.evaluate(() => { hbSetFace('explorer'); }); await until(() => hbFace() === 'explorer' && !!document.querySelector('.ig-viewbar'));
    await page.evaluate(() => { igSetView(1); intel.history = []; if (typeof pdTalkShows === 'function' && pdTalkShows() && typeof pdTalkBack === 'function') pdTalkBack(); renderIntelDock(); });
    await page.waitForTimeout(600);

    /* ================= 5. JAMBO EXPLAINS THE LENS ================= */
    /* asked as a chip asks (typed words are the brain's): the map's own walk */
    await page.evaluate(() => intelAsk(i18t('int_lens_tour_ask')));
    await until(() => !intel.busy && !!intel.tour);
    await page.waitForTimeout(400);
    const walk = await page.evaluate(() => ({ steps: (intel.tour && intel.tour.steps || []).map(s => s.text),
      head: (document.getElementById('ig-note') || {}).textContent || '', why: (document.querySelector('#ig-dock [data-ig-lens-why]') || {}).textContent || '',
      cost: (document.querySelector('#ig-dock .igd-cost') || {}).textContent || '' }));
    const highN = WANT_RISK.high || 0;
    check('5a the walk opens on the whole: N of 18 contracts are high risk', new RegExp('^' + highN + ' of 18 contracts are high risk').test(walk.steps[0] || ''), JSON.stringify(walk.steps));
    const procName = await page.evaluate(() => (FOLDERS.proc && FOLDERS.proc.name) || 'Procurement');
    check('5b worst first: the stream carrying the high risk is the first part', (walk.steps[1] || '').startsWith(procName + ': ' + highN + ' high risk'), walk.steps[1]);
    check('5c the head line says "Explaining this lens"', /Explaining this lens/.test(walk.head), walk.head);
    check('5d the one paid question names the worst part and its cost', walk.why.includes(procName) && /1 Jambo call/.test(walk.cost), JSON.stringify({ why: walk.why, cost: walk.cost }));
    await page.screenshot({ path: path.join(OUT, '5-explain-this-lens.png') });

    /* ================= 6. THE RECIPE AND THE WORDS ================= */
    const rec = await page.evaluate(() => igRecipeNow().lens);
    await page.evaluate(() => { igRecipeUndo(); if (typeof igLensBarPaint === 'function') igLensBarPaint(); });
    const undone = await page.evaluate(() => ({ lens: intel.lens, pressed: document.querySelector('[data-ig-lens="off"]')?.getAttribute('aria-pressed') }));
    check('6a the lens rides the recipe, and Undo puts back the lens before', rec === 'risk' && undone.lens === 'obligations', JSON.stringify({ rec, undone }));
    const words = await page.evaluate(() => typeof igLensRead !== 'function' ? 'no reader' : [igLensRead('put the risk lens on'), igLensRead('show the obligations lens'), igLensRead('lens off'), igLensRead('visa risklinsen'), igLensRead('linsen av'), igLensRead('risk of the lens maker clause?'), igLensRead('group by risk')]);
    check('6b the words read a lens on and off, in both languages, and leave other words alone',
      JSON.stringify(words) === JSON.stringify([{ lens: 'risk' }, { lens: 'obligations' }, { lens: 'off' }, { lens: 'risk' }, { lens: 'off' }, null, null]), JSON.stringify(words));
    const run = await page.evaluate(() => { const p = igRecipeParse('lens off'); return p && p.acts || null; });
    check('6c the map\'s own reader hands "lens off" on as a lens act', JSON.stringify(run) === JSON.stringify([{ lens: 'off' }]), JSON.stringify(run));

    /* ================= 7. THE THREE SCREENS ================= */
    await press('.ig-viewbar [data-ig-lens="risk"]');
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(900);
      const fit = await page.evaluate(() => {
        const st = document.getElementById('ig-gwrap') || document.getElementById('ig-cv'), lr = document.querySelector('.ig-viewbar .ig-lensrow'), lg = document.getElementById('ig-legend');
        if (!st || !lr || !lg) return null; const a = st.getBoundingClientRect(), b = lr.getBoundingClientRect(), c = lg.getBoundingClientRect();
        const btns = [...lr.querySelectorAll('button')].map(x => x.getBoundingClientRect());
        return { inside: b.left >= a.left && b.right <= a.right + 0.5 && b.bottom <= a.bottom + 0.5 && b.top >= a.top,
          clear: b.right <= c.left || b.left >= c.right || b.bottom <= c.top || b.top >= c.bottom,
          oneLine: btns.every(r => Math.abs(r.top - btns[0].top) < 1 && r.height < 30) };
      });
      check(`7 at ${w}×${ht}: the Lens row stands inside the stage, on one line, clear of the legend`, !!fit && fit.inside && fit.clear && fit.oneLine, JSON.stringify(fit));
      await page.screenshot({ path: path.join(OUT, `7-risk-${w}x${ht}.png`) });
    }
    check('8 no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e.message);
  } finally {
    await browser.close(); await h.stop();
    const failed = results.filter(r => !r.pass);
    console.log(`\n${results.length - failed.length} of ${results.length} passed`);
    process.exit(failed.length ? 1 : 0);
  }
})();
