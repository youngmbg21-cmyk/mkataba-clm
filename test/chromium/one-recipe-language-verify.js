/* Chromium verification: ONE RECIPE LANGUAGE FOR EVERY CARD (the owner's work
   order, Part 1, 4 Oct 2026)
   ============================================================
   On Home's board, asked in the panel on the page, free (no Copilot):
     1. "contracts signed by month and by stream" draws STACKED columns; a
        segment is painted where it is pressed, and pressing it opens exactly
        the contracts its label counts;
     2. "heat map of contracts by stream and stage" draws a HEAT GRID;
     3. "contracts signed this year by month compared to last year" draws the
        COMPARISON, said in words over the chart;
     4. "top 3 counterparties" draws three bars and ONE bar for the rest,
        which opens the rest;
     5. "value signed in the last 12 months by stream" says the period under
        the chart;
     6. a press on a kept card's own row changes that card, not the open one;
     7. each picture is photographed in Dark and in Light; no page errors.
   Waits ask for the state. Screenshots go to test/chromium/shots/one-recipe/.
   Run: node test/chromium/one-recipe-language-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'one-recipe');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const dayIn = (months, day) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + months); d.setDate(day);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const BOOK = []; let n = 0;
const CPS = ['Juno AB', 'Juno AB', 'Naivas Supermarkets', 'Bidco', 'Juno AB', 'Sendy', 'Naivas Supermarkets', 'Kevian'];
const add = (status, o) => { const c = fixtureContract('MK-' + (500 + n), 'Agreement ' + n, CPS[n % CPS.length], n % 3 ? 'proc' : 'sales', 1e6 * (1 + (n % 4)), status); n++;
  c.expiry = dayIn(8 + (n % 10), 10); Object.assign(c, o || {}); BOOK.push(c); };
/* signings over the last two years, two a month */
for (let k = 0; k < 40; k++) add('Signed', { signedAt: dayIn(-1 - Math.floor(k / 2), 6 + (k % 2) * 10) + 'T10:00:00.000Z' });
for (let k = 0; k < 6; k++) add(k % 2 ? 'Draft' : 'Under Review');

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
  let spent = 0;
  /* a question that spends goes to one of Copilot's routes (the usage and
     configuration reads are not spending) */
  await page.route('**/api/ai/**', route => { if (!/\/api\/ai\/(usage|config|spend)/.test(route.request().url())) spent++; return route.fallback(); });
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  const ask = async q => { await page.evaluate(() => { intel.history = []; });
    await page.evaluate(async q => { await intelAsk(q); }, q);
    return until(() => { const a = (intel.history || []).filter(m => m.role === 'assistant'); return a.length ? a.map(m => String(m.text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()).join(' / ') : null; }); };
  /* both screens, each photographed */
  const shoot = async name => {
    for (const scr of ['dark', 'light']){
      await page.evaluate(scr => { const s = hbS(); s.screen = scr; hbSave(); hbApplyScreen(); hbPaintBoard({ jump: 'focus' }); }, scr);
      await page.waitForTimeout(1100);
      const f = await page.$('#hb-focus'); if (f) await f.screenshot({ path: path.join(OUT, `${name}-${scr}.png`) });
    }
    await page.evaluate(() => { const s = hbS(); s.screen = 'dark'; hbSave(); hbApplyScreen(); hbPaintBoard({ jump: 'focus' }); });
  };
  /* the doors in the open card: each one's label count, and the list it opens */
  const doorsMatch = () => page.evaluate(() => {
    const out = []; const s = hbS();
    document.querySelectorAll('#hb-focus svg [data-hb-dig]').forEach(g => {
      const key = g.getAttribute('data-hb-dig'); if (!/^(q2|qr|qg|qm):/.test(key)) return;
      const t = (g.querySelector('title') || {}).textContent || ''; const m = /(\d[\d,\s ]*)\s*$/.exec(t.split('·').pop()); if (!m) return;
      const D = hbDigData(key, s.lens); out.push({ key, said: Number(m[1].replace(/[^\d]/g, '')), n: D ? D.n : -1 });
    });
    return { n: out.length, bad: out.filter(x => x.said !== x.n).slice(0, 3) };
  });
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(ids => window.state && state.contracts && ids.every(id => state.contracts.some(c => c.id === id)), BOOK.map(c => c.id), { timeout: 20000 });
    await page.evaluate(() => { const s = hbS(); s.face = 'board'; s.prep = 'closed'; s.panels = []; s.path = []; s.digBig = false; s.recipe = {}; s.screen = 'dark'; hbSave(); setView('dashboard'); });
    await until(() => document.getElementById('hb-board') ? true : null);
    if (!(await page.evaluate(() => typeof hbCardSet === 'function'))) throw new Error('the one recipe language is not on this board');

    /* ================= 1. STACKED ================= */
    await ask('contracts signed by month and by stream');
    const st = await until(() => { const f = document.querySelector('#hb-focus svg.hb-stack'); return f ? { segs: f.querySelectorAll('[data-hb-dig^="q2:"]').length } : null; });
    check('1a "by month and by stream" draws stacked columns', !!st && st.segs >= 6, JSON.stringify(st));
    const d1 = await doorsMatch();
    check('1b every segment\'s number is the list behind it', d1.n >= 6 && !d1.bad.length, JSON.stringify(d1));
    /* a segment is painted where it is pressed */
    const hit = await page.evaluate(() => { const g = document.querySelector('#hb-focus svg.hb-stack [data-hb-dig^="q2:"] rect'); if (!g) return null;
      g.scrollIntoView({ block: 'center' }); const r = g.getBoundingClientRect(); const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      const door = el && el.closest('[data-hb-dig]'); return { same: !!door && door === g.closest('[data-hb-dig]'), key: door && door.getAttribute('data-hb-dig'), w: r.width, h: r.height }; });
    check('1c a segment is painted where it is pressed', !!hit && hit.same && hit.w > 2 && hit.h > 0.5, JSON.stringify(hit));
    await shoot('1-stack');
    if (hit && hit.key){
      const want = await page.evaluate(k => hbDigData(k, hbS().lens).n, hit.key);
      await page.evaluate(k => { const g = [...document.querySelectorAll('#hb-focus [data-hb-dig]')].find(x => x.getAttribute('data-hb-dig') === k); g.dispatchEvent(new MouseEvent('click', { bubbles: true })); }, hit.key);
      const got = await until(k => { const s = hbS(); return (s.path || []).slice(-1)[0] === k ? hbDigData(k, s.lens).n : null; }, hit.key);
      check('1d pressing it opens exactly those contracts, nested under the chart', got === want && want > 0, JSON.stringify({ want, got }));
    }

    /* ================= 2. HEAT GRID ================= */
    await ask('heat map of contracts by stream and stage');
    const ht = await until(() => { const f = document.querySelector('#hb-focus svg.hb-heat'); return f ? { cells: f.querySelectorAll('rect.hb-sv-heat').length } : null; });
    check('2a a heat grid, its cells shaded', !!ht && ht.cells >= 3, JSON.stringify(ht));
    const d2 = await doorsMatch();
    check('2b every cell opens the contracts it counts', d2.n >= 3 && !d2.bad.length, JSON.stringify(d2));
    await shoot('2-heat');

    /* ================= 3. COMPARISON ================= */
    await ask('contracts signed this year by month compared to last year');
    const cp = await until(() => { const f = document.querySelector('#hb-focus'); const svg = f && f.querySelector('svg.hb-cmp'); if (!svg) return null;
      return { lead: (f.querySelector('.hb-chart-lead') || {}).textContent.replace(/\s+/g, ' ').trim(), prev: svg.querySelectorAll('rect.hb-sv-colprev').length }; });
    check('3a the comparison is drawn, the year before beside each month', !!cp && cp.prev >= 3, JSON.stringify(cp));
    check('3b and said in words: this year against a year earlier', !!cp && /^This year so far: \d+ contracts · A year earlier: \d+ contracts · (up \d+%|down \d+%|no change|new)/.test(cp.lead), cp && cp.lead);
    const d3 = await doorsMatch();
    check('3c each bar opens its own contracts', d3.n >= 3 && !d3.bad.length, JSON.stringify(d3));
    await shoot('3-compare');

    /* ================= 4. TOP N ================= */
    const said4 = await ask('top 3 counterparties');
    const tp = await until(() => { const f = document.querySelector('#hb-focus'); if (!f || !/^q:top 3/.test((hbS().path || []).slice(-1)[0] || '')) return null;
      const rest = f.querySelector('[data-hb-dig^="qr:"]'); return { slices: f.querySelectorAll('svg [data-hb-dig^="qg:"]').length, rest: rest && rest.getAttribute('data-hb-dig') }; });
    check('4a three groups and ONE more for the rest', !!tp && tp.rest && tp.slices >= 3, JSON.stringify(tp));
    if (tp && tp.rest){
      const r4 = await page.evaluate(k => { const g = [...document.querySelectorAll('#hb-focus [data-hb-dig]')].find(x => x.getAttribute('data-hb-dig') === k);
        const t = (g.querySelector('title') || {}).textContent || ''; const n0 = t.slice(t.indexOf(':') + 1).split('·').map(x => x.trim()).find(x => /^\d[\d,\s ]*$/.test(x)); return { said: n0 ? Number(n0.replace(/[^\d]/g, '')) : null, n: hbDigData(k, hbS().lens).n, t }; }, tp.rest);
      check('4b the rest opens exactly the rest', r4.said != null && r4.said === r4.n && r4.n > 0, JSON.stringify(r4)); }
    check('4c answered free, on the board', /Free/.test(said4 || ''), said4);
    await shoot('4-top');

    /* ================= 5. PERIOD ================= */
    await ask('value signed in the last 12 months by stream');
    const pd = await until(() => { const f = document.querySelector('#hb-focus .hb-chart-note'); return f ? f.textContent.replace(/\s+/g, ' ').trim() : null; });
    check('5a the period is said under the chart', /Last 12 months by signed: \d+ of \d+ contracts\./.test(pd || ''), pd);
    await shoot('5-period');

    /* ================= 6. A KEPT CARD'S OWN ROW ================= */
    const six = await page.evaluate(() => {
      const s = hbS(); const open = (s.path || []).slice(-1)[0];
      s.panels = [{ id: 'pk1', kind: 'view', key: 'q:contracts by stage', title: 'By stage', recipe: { pic: 'ring', split: { by: 'status' } }, split: false, big: false }];
      hbSave(); hbPaintBoard();
      document.querySelector('[data-hb-pid="pk1"] [data-hb-rkey] [data-hb-rmore]').click();
      document.querySelector('[data-hb-pid="pk1"] [data-hb-rkey] [data-hb-rc="split2"]').click();
      const opt = document.querySelector('[data-hb-pid="pk1"] [data-hb-rset="split2:g:folder"]'); if (opt) opt.click();
      const P = hbPlan(hbDigData('q:contracts by stage', s.lens));
      return { panel: P.split2 && P.split2.by, pic: P.pic, openKept: JSON.stringify((s.recipe || {})[open] || {}).indexOf('split2') < 0 || /stream/.test(open), kept: !!(s.panels[0].recipe && s.panels[0].recipe.split2) };
    });
    check('6a a press on the kept card\'s row changes that card, and it keeps the change', six.panel === 'folder' && six.pic === 'stack' && six.kept, JSON.stringify(six));
    check('6b the open card is untouched', six.openKept, JSON.stringify(six));

    check('nothing was spent', spent === 0, String(spent));
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
